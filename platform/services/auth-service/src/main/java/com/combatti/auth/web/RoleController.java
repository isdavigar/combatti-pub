package com.combatti.auth.web;

import com.combatti.auth.service.UserManagementService;
import com.combatti.auth.web.dto.RoleDto;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth/roles")
@PreAuthorize("hasAuthority('users.manage')")
public class RoleController {

    private final UserManagementService userService;

    public RoleController(UserManagementService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<RoleDto> list() {
        return userService.listRoles();
    }
}
