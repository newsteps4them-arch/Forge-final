package com.forge.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        String userAgent = bridge.getWebView().getSettings().getUserAgentString();
        userAgent = userAgent.replace("; wv", "");
        bridge.getWebView().getSettings().setUserAgentString(userAgent);
    }
}
