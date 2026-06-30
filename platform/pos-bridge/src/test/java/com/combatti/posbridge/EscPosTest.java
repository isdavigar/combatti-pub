package com.combatti.posbridge;

import com.combatti.posbridge.escpos.EscPos;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EscPosTest {

    @Test
    void initEmitsEscAt() {
        byte[] data = new EscPos().init().text("AB").bytes();
        assertThat(data[0]).isEqualTo((byte) 0x1B);
        assertThat(data[1]).isEqualTo((byte) 0x40);
        assertThat(data[2]).isEqualTo((byte) 'A');
        assertThat(data[3]).isEqualTo((byte) 'B');
    }

    @Test
    void openDrawerEmitsKickSequence() {
        byte[] data = new EscPos().openDrawer().bytes();
        // ESC p 0 25 250
        assertThat(data).containsExactly(
                (byte) 0x1B, (byte) 'p', (byte) 0, (byte) 25, (byte) (250 & 0xFF));
    }

    @Test
    void cutEmitsGsV() {
        byte[] data = new EscPos().cut().bytes();
        assertThat(data).containsExactly((byte) 0x1D, (byte) 'V', (byte) 66, (byte) 0);
    }

    @Test
    void lineAppendsLineFeed() {
        byte[] data = new EscPos().line("X").bytes();
        assertThat(data[data.length - 1]).isEqualTo((byte) 0x0A);
    }
}
