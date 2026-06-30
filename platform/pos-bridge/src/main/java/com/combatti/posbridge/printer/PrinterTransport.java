package com.combatti.posbridge.printer;

/**
 * Abstracción del envío de bytes a la impresora. Permite distintos transportes
 * (red, USB/serial, o sin hardware) sin acoplar la lógica de impresión.
 */
public interface PrinterTransport {

    void send(byte[] data);

    /** Nombre descriptivo del transporte (para diagnóstico). */
    String describe();
}
