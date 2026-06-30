package com.combatti.posbridge.printer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Transporte sin hardware: registra el envío. Útil en desarrollo y para
 * instalaciones sin impresora configurada.
 */
public class NoopPrinterTransport implements PrinterTransport {

    private static final Logger log = LoggerFactory.getLogger(NoopPrinterTransport.class);

    @Override
    public void send(byte[] data) {
        log.info("[noop-printer] {} bytes (sin hardware)", data != null ? data.length : 0);
    }

    @Override
    public String describe() {
        return "noop";
    }
}
