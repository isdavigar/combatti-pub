package com.combatti.orders.realtime;

import com.combatti.common.security.AuthenticatedUser;
import com.combatti.common.security.JwtService;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Valida el JWT en el frame CONNECT de STOMP (el token viaja como header
 * nativo "Authorization", no en el handshake HTTP).
 */
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    public StompAuthChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String header = accessor.getFirstNativeHeader("Authorization");
            if (header == null || !header.startsWith(BEARER_PREFIX)) {
                throw new MessagingException("No autenticado: falta el token");
            }
            try {
                AuthenticatedUser user = jwtService.parseToken(header.substring(BEARER_PREFIX.length()).trim());
                accessor.setUser(new UsernamePasswordAuthenticationToken(user, null, List.of()));
            } catch (RuntimeException ex) {
                throw new MessagingException("Token inválido");
            }
        }
        return message;
    }
}
