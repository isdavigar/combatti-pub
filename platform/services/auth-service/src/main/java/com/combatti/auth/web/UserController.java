package com.combatti.auth.web;

import com.combatti.auth.service.UserManagementService;
import com.combatti.auth.web.dto.CreateUserRequest;
import com.combatti.auth.web.dto.ResetPasswordRequest;
import com.combatti.auth.web.dto.UpdateUserRequest;
import com.combatti.auth.web.dto.UserSummaryDto;
import com.combatti.common.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth/users")
@PreAuthorize("hasAuthority('users.manage')")
public class UserController {

    private final UserManagementService userService;

    public UserController(UserManagementService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserSummaryDto> list(@AuthenticationPrincipal AuthenticatedUser principal) {
        return userService.listUsers(principal.tenantId());
    }

    @PostMapping
    public ResponseEntity<UserSummaryDto> create(@AuthenticationPrincipal AuthenticatedUser principal,
                                                 @Valid @RequestBody CreateUserRequest request) {
        UserSummaryDto created = userService.createUser(principal.tenantId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public UserSummaryDto update(@AuthenticationPrincipal AuthenticatedUser principal,
                                 @PathVariable Long id,
                                 @Valid @RequestBody UpdateUserRequest request) {
        return userService.updateUser(principal.tenantId(), id, request);
    }

    @PostMapping("/{id}/password")
    public ResponseEntity<Void> resetPassword(@AuthenticationPrincipal AuthenticatedUser principal,
                                              @PathVariable Long id,
                                              @Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(principal.tenantId(), id, request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser principal,
                                       @PathVariable Long id) {
        userService.deleteUser(principal.tenantId(), id, principal.userId());
        return ResponseEntity.noContent().build();
    }
}
