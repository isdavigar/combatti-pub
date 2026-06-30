package com.combatti.posbridge;

import com.combatti.posbridge.printer.PrinterTransport;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import java.io.ByteArrayOutputStream;

/**
 * Transporte de impresora que captura los bytes en memoria, para verificar la
 * salida ESC/POS sin hardware.
 */
@TestConfiguration
public class TestPrinterConfig {

    @Bean
    @Primary
    public CapturingPrinterTransport capturingPrinterTransport() {
        return new CapturingPrinterTransport();
    }

    public static class CapturingPrinterTransport implements PrinterTransport {

        private final ByteArrayOutputStream lastData = new ByteArrayOutputStream();

        @Override
        public synchronized void send(byte[] data) {
            lastData.reset();
            lastData.writeBytes(data);
        }

        @Override
        public String describe() {
            return "capturing";
        }

        public synchronized byte[] last() {
            return lastData.toByteArray();
        }
    }
}
