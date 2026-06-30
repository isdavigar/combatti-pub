package com.combatti.posbridge.escpos;

import java.io.ByteArrayOutputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

/**
 * Constructor de comandos ESC/POS para impresoras térmicas. Acumula bytes y
 * los entrega con {@link #bytes()}.
 */
public class EscPos {

    // Comandos ESC/POS
    private static final byte ESC = 0x1B;
    private static final byte GS = 0x1D;
    private static final byte LF = 0x0A;

    public enum Align {
        LEFT(0), CENTER(1), RIGHT(2);
        final byte value;
        Align(int v) {
            this.value = (byte) v;
        }
    }

    private final ByteArrayOutputStream out = new ByteArrayOutputStream();
    private final Charset charset;

    public EscPos() {
        // Latin-1 cubre acentos básicos del español en la mayoría de impresoras.
        this(StandardCharsets.ISO_8859_1);
    }

    public EscPos(Charset charset) {
        this.charset = charset;
    }

    /** Inicializa la impresora (ESC @). */
    public EscPos init() {
        return write(ESC, (byte) '@');
    }

    public EscPos align(Align align) {
        return write(ESC, (byte) 'a', align.value);
    }

    public EscPos bold(boolean on) {
        return write(ESC, (byte) 'E', (byte) (on ? 1 : 0));
    }

    /** Tamaño doble (ancho y alto) o normal (GS ! n). */
    public EscPos doubleSize(boolean on) {
        return write(GS, (byte) '!', (byte) (on ? 0x11 : 0x00));
    }

    public EscPos text(String value) {
        byte[] encoded = (value == null ? "" : value).getBytes(charset);
        out.write(encoded, 0, encoded.length);
        return this;
    }

    public EscPos line(String value) {
        text(value);
        return feed(1);
    }

    public EscPos feed(int lines) {
        for (int i = 0; i < Math.max(lines, 0); i++) {
            out.write(LF);
        }
        return this;
    }

    /** Corte de papel (GS V 66 0: feed + corte parcial). */
    public EscPos cut() {
        return write(GS, (byte) 'V', (byte) 66, (byte) 0);
    }

    /** Pulso para abrir el cajón monedero (ESC p 0 25 250). */
    public EscPos openDrawer() {
        return write(ESC, (byte) 'p', (byte) 0, (byte) 25, (byte) (250 & 0xFF));
    }

    public byte[] bytes() {
        return out.toByteArray();
    }

    private EscPos write(byte... data) {
        out.write(data, 0, data.length);
        return this;
    }
}
