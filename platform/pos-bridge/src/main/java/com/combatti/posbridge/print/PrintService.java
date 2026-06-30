package com.combatti.posbridge.print;

import com.combatti.posbridge.config.PrinterProperties;
import com.combatti.posbridge.escpos.EscPos;
import com.combatti.posbridge.printer.PrinterTransport;
import com.combatti.posbridge.web.dto.KitchenItem;
import com.combatti.posbridge.web.dto.KitchenTicketRequest;
import com.combatti.posbridge.web.dto.ReceiptLine;
import com.combatti.posbridge.web.dto.ReceiptRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PrintService {

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final PrinterTransport transport;
    private final PrinterProperties properties;

    public PrintService(PrinterTransport transport, PrinterProperties properties) {
        this.transport = transport;
        this.properties = properties;
    }

    public void printReceipt(ReceiptRequest request) {
        EscPos esc = new EscPos().init()
                .align(EscPos.Align.CENTER).bold(true).doubleSize(true)
                .line(properties.getBusinessName())
                .doubleSize(false).bold(false)
                .line("Recibo de venta")
                .line(TS.format(LocalDateTime.now()))
                .align(EscPos.Align.LEFT)
                .line("--------------------------------");

        if (request.orderId() != null) {
            esc.line("Pedido: #" + request.orderId());
        }

        if (request.items() != null) {
            for (ReceiptLine item : request.items()) {
                esc.line(item.quantity() + " x " + safe(item.name()));
                esc.align(EscPos.Align.RIGHT).line(money(item.lineTotal())).align(EscPos.Align.LEFT);
            }
        }

        esc.line("--------------------------------");
        esc.bold(true).text("TOTAL: ").line(money(request.total())).bold(false);

        if (request.paymentMethod() != null) {
            esc.line("Pago: " + request.paymentMethod());
        }
        if (request.cashReceived() != null) {
            esc.line("Recibido: " + money(request.cashReceived()));
        }
        if (request.changeGiven() != null) {
            esc.line("Cambio: " + money(request.changeGiven()));
        }

        esc.feed(1).align(EscPos.Align.CENTER).line("¡Gracias por su compra!")
                .align(EscPos.Align.LEFT).feed(1);

        if (request.openDrawer()) {
            esc.openDrawer();
        }
        esc.cut();

        transport.send(esc.bytes());
    }

    public void printKitchen(KitchenTicketRequest request) {
        EscPos esc = new EscPos().init()
                .align(EscPos.Align.CENTER).bold(true).doubleSize(true)
                .line("COCINA")
                .doubleSize(false)
                .line(request.destination() != null ? safe(request.destination()) : "")
                .bold(false)
                .line(TS.format(LocalDateTime.now()))
                .align(EscPos.Align.LEFT)
                .line("--------------------------------");

        if (request.orderId() != null) {
            esc.line("Pedido: #" + request.orderId());
        }

        for (KitchenItem item : request.items()) {
            esc.bold(true).line(item.quantity() + " x " + safe(item.name())).bold(false);
            if (item.notes() != null && !item.notes().isBlank()) {
                esc.line("   * " + item.notes());
            }
        }

        if (request.notes() != null && !request.notes().isBlank()) {
            esc.line("--------------------------------");
            esc.line("Nota: " + request.notes());
        }

        esc.feed(2).cut();
        transport.send(esc.bytes());
    }

    public void openDrawer() {
        EscPos esc = new EscPos().init().openDrawer();
        transport.send(esc.bytes());
    }

    public String printerStatus() {
        return transport.describe();
    }

    private String money(BigDecimal value) {
        long v = value != null ? value.longValue() : 0L;
        return String.format("$%,d", v);
    }

    private String safe(String value) {
        return value != null ? value : "";
    }
}
