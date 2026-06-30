package com.combatti.posbridge.web;

import com.combatti.posbridge.print.PrintService;
import com.combatti.posbridge.web.dto.KitchenTicketRequest;
import com.combatti.posbridge.web.dto.ReceiptRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/pos")
public class PosController {

    private final PrintService printService;

    public PosController(PrintService printService) {
        this.printService = printService;
    }

    @PostMapping("/print/receipt")
    public ResponseEntity<Map<String, Object>> printReceipt(@Valid @RequestBody ReceiptRequest request) {
        printService.printReceipt(request);
        return ResponseEntity.ok(Map.of("printed", true));
    }

    @PostMapping("/print/kitchen")
    public ResponseEntity<Map<String, Object>> printKitchen(@Valid @RequestBody KitchenTicketRequest request) {
        printService.printKitchen(request);
        return ResponseEntity.ok(Map.of("printed", true));
    }

    @PostMapping("/cash-drawer/open")
    public ResponseEntity<Map<String, Object>> openDrawer() {
        printService.openDrawer();
        return ResponseEntity.ok(Map.of("opened", true));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of("printer", printService.printerStatus()));
    }
}
