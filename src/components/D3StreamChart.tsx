import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface TelemetryPoint {
  time: string; // or Date
  timestamp?: number;
  value: number;
  [key: string]: any;
}

interface D3StreamChartProps {
  data: TelemetryPoint[];
  dataKey: string;
  unit: string;
  label: string;
  color?: string;
  height?: number;
}

export const D3StreamChart: React.FC<D3StreamChartProps> = ({
  data,
  dataKey,
  unit,
  label,
  color = "#F5A623",
  height = 240,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: number; time: string } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 500;
    const margin = { top: 20, right: 25, bottom: 30, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.attr("width", width).attr("height", height);

    if (!data || data.length === 0) return;

    // Process data points
    const parsedData = data.map((d, i) => {
      const val = typeof d[dataKey] === "number" ? d[dataKey] : Number(d[dataKey]) || 0;
      return {
        index: i,
        time: d.time || `${i}`,
        val,
      };
    });

    const xExtent = [0, Math.max(1, parsedData.length - 1)];
    const yValues = parsedData.map((d) => d.val);
    const minVal = d3.min(yValues) ?? 0;
    const maxVal = d3.max(yValues) ?? 100;
    const padding = (maxVal - minVal) * 0.15 || 10;
    const yDomain = [Math.max(0, minVal - padding), maxVal + padding];

    // Scales
    const xScale = d3.scaleLinear().domain(xExtent).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]);

    // Create container group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Gradient Definition
    const gradientId = `stream-grad-${dataKey.replace(/[^a-zA-Z0-9]/g, "")}`;
    const defs = svg.append("defs");
    
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    linearGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", color)
      .attr("stop-opacity", 0.4);

    linearGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", color)
      .attr("stop-opacity", 0);

    // Glow Filter
    const filterId = `glow-${dataKey.replace(/[^a-zA-Z0-9]/g, "")}`;
    const filter = defs.append("filter").attr("id", filterId).attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Gridlines (Horizontal)
    const yTicks = yScale.ticks(5);
    g.append("g")
      .selectAll("line.grid-y")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("class", "grid-y")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "rgba(255,255,255,0.06)")
      .attr("stroke-dasharray", "3,3");

    // Axes
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d}`);
    const yAxisG = g.append("g").call(yAxis);
    yAxisG.selectAll("path, line").attr("stroke", "rgba(255,255,255,0.15)");
    yAxisG.selectAll("text").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", "10px").attr("font-family", "monospace");

    // X Axis (latest time ticks)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(5, parsedData.length))
      .tickFormat((d) => {
        const idx = Math.round(d as number);
        return parsedData[idx]?.time || "";
      });
    const xAxisG = g.append("g").attr("transform", `translate(0,${innerHeight})`).call(xAxis);
    xAxisG.selectAll("path, line").attr("stroke", "rgba(255,255,255,0.15)");
    xAxisG.selectAll("text").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", "9px").attr("font-family", "monospace");

    // Area Generator
    const area = d3
      .area<{ index: number; val: number }>()
      .x((d) => xScale(d.index))
      .y0(innerHeight)
      .y1((d) => yScale(d.val))
      .curve(d3.curveMonotoneX);

    // Line Generator
    const line = d3
      .line<{ index: number; val: number }>()
      .x((d) => xScale(d.index))
      .y((d) => yScale(d.val))
      .curve(d3.curveMonotoneX);

    // Render Area
    g.append("path")
      .datum(parsedData)
      .attr("fill", `url(#${gradientId})`)
      .attr("d", area);

    // Render Line with glow
    g.append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.5)
      .attr("filter", `url(#${filterId})`)
      .attr("d", line);

    // Real-time live pulse dot at latest point
    const lastPoint = parsedData[parsedData.length - 1];
    if (lastPoint) {
      const cx = xScale(lastPoint.index);
      const cy = yScale(lastPoint.val);

      g.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 6)
        .attr("fill", color)
        .attr("opacity", 0.4)
        .append("animate")
        .attr("attributeName", "r")
        .attr("values", "4;10;4")
        .attr("dur", "1.5s")
        .attr("repeatCount", "indefinite");

      g.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 4)
        .attr("fill", "#FFFFFF")
        .attr("stroke", color)
        .attr("stroke-width", 2);
    }

    // Interactive Overlay for Tooltip / Crosshair
    const overlay = g
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    overlay.on("mousemove", (event) => {
      const [mouseX] = d3.pointer(event);
      const index = Math.round(xScale.invert(mouseX));
      const pt = parsedData[Math.max(0, Math.min(parsedData.length - 1, index))];
      if (pt) {
        setHoveredPoint({
          x: xScale(pt.index) + margin.left,
          y: yScale(pt.val) + margin.top,
          val: pt.val,
          time: pt.time,
        });
      }
    });

    overlay.on("mouseleave", () => {
      setHoveredPoint(null);
    });

  }, [data, dataKey, color, height]);

  const latestVal = data.length ? data[data.length - 1][dataKey] : "--";

  return (
    <div className="w-full bg-black/60 border border-primary/20 rounded-3xl p-4 shadow-2xl relative overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <h3 className="text-xs font-black uppercase tracking-widest text-primary font-mono">
            D3 Stream Engine • {label}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/50 font-mono uppercase tracking-wider">
            Live Stream
          </span>
          <span className="text-sm font-black font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/30">
            {latestVal} {unit}
          </span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="w-full relative min-h-[200px] flex-1">
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Hover Crosshair / Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none bg-black/90 border border-primary/50 text-white rounded-lg px-2.5 py-1 text-[10px] font-mono shadow-xl -translate-x-1/2 -translate-y-full mb-2 z-20"
            style={{ left: `${hoveredPoint.x}px`, top: `${hoveredPoint.y}px` }}
          >
            <div className="text-primary font-bold">{hoveredPoint.val} {unit}</div>
            <div className="text-white/40 text-[8px]">{hoveredPoint.time}</div>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center text-[10px] text-white/40 font-mono">
        <span>Sampling: 800ms</span>
        <span>Engine: D3.js v7</span>
        <span>Points: {data.length}</span>
      </div>
    </div>
  );
};
