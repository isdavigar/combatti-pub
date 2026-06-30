package com.combatti.posbridge.config;

import com.combatti.posbridge.printer.NetworkPrinterTransport;
import com.combatti.posbridge.printer.NoopPrinterTransport;
import com.combatti.posbridge.printer.PrinterTransport;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(PrinterProperties.class)
public class PrinterConfig {

    @Bean
    @ConditionalOnMissingBean(PrinterTransport.class)
    public PrinterTransport printerTransport(PrinterProperties properties) {
        if ("network".equalsIgnoreCase(properties.getType())) {
            return new NetworkPrinterTransport(
                    properties.getHost(), properties.getPort(), properties.getTimeoutMs());
        }
        return new NoopPrinterTransport();
    }
}
