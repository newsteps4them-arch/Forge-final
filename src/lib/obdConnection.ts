/**
 * OBD-II Connection Libraries
 *
 * This module provides abstraction layers for different hardware communication
 * protocols used to interface with ELM327-compatible OBD-II adapters.
 */

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type ObdDeviceType = 'bluetooth' | 'serial' | 'simulated';

/**
 * Common interface for all OBD-II connection types.
 */
export interface ObdConnection {
  /** Opens the connection to the hardware. */
  connect(): Promise<void>;
  /** Closes the hardware connection. */
  disconnect(): Promise<void>;
  /** Sends a raw PID command and returns the response string. */
  sendCommand(command: string): Promise<string>;
  /** Returns true if currently connected. */
  isConnected(): boolean;
}

/**
 * Web Bluetooth Implementation
 * Targets BLE-based ELM327 adapters (e.g. HM-10, VLinker).
 */
export class WebBluetoothObd implements ObdConnection {
  private device: any | null = null;
  private rxCharacteristic: any | null = null;
  private txCharacteristic: any | null = null;
  private connected = false;
  private buffer = '';
  private resolver: ((value: string) => void) | null = null;

  async connect(): Promise<void> {
    if (!('bluetooth' in navigator)) {
      throw new Error("Web Bluetooth API not supported in this environment. Please use Chrome or a compatible browser. For Android apps, specific plugins are required.");
    }
    
    try {
      // Prompt user for BLE device
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb', '0000fff0-0000-1000-8000-00805f9b34fb'] 
      });

      this.device.addEventListener('gattserverdisconnected', () => {
        this.connected = false;
      });

      const server = await this.device.gatt?.connect();
      if (!server) throw new Error("Could not connect to GATT Server");

      // We'll try common BLE UART services
      let service: any | undefined;
      try {
        service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
      } catch (e) {
        service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      }

      if (!service) throw new Error("Could not find a serial characteristic service");

      const characteristics = await service.getCharacteristics();
      
      // FFE1 is common for HM-10 RX/TX
      const rxTxCharacteristic = characteristics.find((c: any) => c.uuid.includes('ffe1')) || characteristics[0];

      if (rxTxCharacteristic.properties.notify || rxTxCharacteristic.properties.indicate) {
        this.rxCharacteristic = rxTxCharacteristic;
        this.txCharacteristic = rxTxCharacteristic;
        
        await this.rxCharacteristic.startNotifications();
        this.rxCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value;
          const decoder = new TextDecoder('utf-8');
          const str = decoder.decode(value);
          this.buffer += str;

          if (this.buffer.includes('>')) {
             if (this.resolver) {
               this.resolver(this.buffer);
               this.resolver = null;
               this.buffer = '';
             }
          }
        });
      } else {
         // Separate RX and TX
         this.txCharacteristic = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse) || null;
         this.rxCharacteristic = characteristics.find((c: any) => c.properties.notify) || null;
         if (this.rxCharacteristic) {
           await this.rxCharacteristic.startNotifications();
           this.rxCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => {
            const value = event.target.value;
            const decoder = new TextDecoder('utf-8');
            const str = decoder.decode(value);
            this.buffer += str;
            if (this.buffer.includes('>')) {
               if (this.resolver) {
                 this.resolver(this.buffer);
                 this.resolver = null;
                 this.buffer = '';
               }
            }
          });
         }
      }

      if (!this.txCharacteristic) throw new Error("Could not find TX characteristic");

      this.connected = true;

      // ELM327 Initialization
      await this.sendCommand('ATZ');
      await this.sendCommand('ATE0');
      await this.sendCommand('ATL0');
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.connected = false;
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.connected || !this.txCharacteristic) throw new Error("Not connected");
    
    this.buffer = '';
    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\r');
    
    return new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.txCharacteristic!.writeValue(data).catch(reject);
      
      // Timeout
      setTimeout(() => {
         if (this.resolver) {
           this.resolver = null;
           resolve(this.buffer || "TIMEOUT");
         }
      }, 5000);
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Web Serial Implementation
 * Targets USB-based ELM327 adapters or passthrough interfaces.
 */
export class WebSerialObd implements ObdConnection {
  private port: any | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private writer: WritableStreamDefaultWriter | null = null;
  private connected = false;
  private buffer = '';
  private resolver: ((value: string) => void) | null = null;

  async connect(): Promise<void> {
    if (!('serial' in navigator)) {
       throw new Error("Web Serial API not supported in this browser. Please use Chrome/Edge or enable flags.");
    }
    
    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate: 38400 }); // standard ELM327 baud rate, sometimes 115200

      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
      this.writer = textEncoder.writable.getWriter();

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable.getReader();

      this.connected = true;

      this.readLoop();

      // Setup
      await this.sendCommand('ATZ');
      await this.sendCommand('ATE0');
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  private async readLoop() {
    if (!this.reader) return;
    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (value) {
          this.buffer += value;
          if (this.buffer.includes('>')) {
             if (this.resolver) {
               this.resolver(this.buffer);
               this.resolver = null;
               this.buffer = '';
             }
          }
        }
        if (done) break;
      }
    } catch (e) {
      console.error('Serial read error:', e);
      this.connected = false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.reader?.cancel();
    this.writer?.close();
    await this.port?.close();
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.connected || !this.writer) throw new Error("Not connected");
    
    this.buffer = '';
    return new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.writer!.write(command + '\r').catch(reject);

      setTimeout(() => {
         if (this.resolver) {
            this.resolver = null;
            resolve(this.buffer || "TIMEOUT");
         }
      }, 5000);
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Simulated/Mock OBD-II Implementation
 * Used for development and testing without physical hardware.
 */
export class SimulatedObd implements ObdConnection {
  private connected = false;

  async connect(): Promise<void> {
    await sleep(500);
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    await sleep(100);
    this.connected = false;
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.connected) throw new Error("Not connected");
    await sleep(200 + Math.random() * 300);
    
    const cmd = command.toUpperCase().trim();
    if (cmd === 'ATZ') return "ELM327 v2.1\r\r>";
    if (cmd === 'ATI') return "OBDII to RS232 Interpreter\r\r>";
    if (cmd.startsWith('AT')) return "OK\r\r>";
    
    if (cmd === '0100') return "41 00 BE 3F A8 13 \r\r>";
    if (cmd === '010C') {
       // RPM
       const rpm = Math.floor(800 + Math.random() * 2000);
       const a = Math.floor(rpm / 256);
       const b = rpm % 256;
       return `41 0C ${a.toString(16).padStart(2, '0').toUpperCase()} ${b.toString(16).padStart(2, '0').toUpperCase()} \r\r>`;
    }
    if (cmd === '0105') {
       // ECT
       const tempC = Math.floor(80 + Math.random() * 20);
       return `41 05 ${(tempC + 40).toString(16).padStart(2, '0').toUpperCase()} \r\r>`;
    }

    if (cmd === '03') {
       // Read DTC
       return "43 01 33 00 00 \r\r>"; // P0133
    }
    
    return "NO DATA\r\r>";
  }

  isConnected(): boolean {
    return this.connected;
  }
}
