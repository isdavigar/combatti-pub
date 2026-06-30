package com.combatti.posbridge.printer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;

/**
 * Transporte para impresoras térmicas de red (socket TCP, típicamente puerto
 * 9100 - RAW/JetDirect).
 */
public class NetworkPrinterTransport implements PrinterTransport {

    private final String host;
    private final int port;
    private final int timeoutMs;

    public NetworkPrinterTransport(String host, int port, int timeoutMs) {
        this.host = host;
        this.port = port;
        this.timeoutMs = timeoutMs;
    }

    @Override
    public void send(byte[] data) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            OutputStream os = socket.getOutputStream();
            os.write(data);
            os.flush();
        } catch (IOException ex) {
            throw new PrinterException("No se pudo imprimir en " + host + ":" + port + " - " + ex.getMessage(), ex);
        }
    }

    @Override
    public String describe() {
        return "network(" + host + ":" + port + ")";
    }
}
