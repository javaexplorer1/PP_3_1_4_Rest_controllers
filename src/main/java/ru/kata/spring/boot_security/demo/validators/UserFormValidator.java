package ru.kata.spring.boot_security.demo.validators;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;
import ru.kata.spring.boot_security.demo.models.User;
import ru.kata.spring.boot_security.demo.services.UserDetailsServiceImpl;


@Component
public class UserFormValidator implements Validator {

    private final UserDetailsServiceImpl userService;

    @Autowired
    public UserFormValidator(UserDetailsServiceImpl userService) {
        this.userService = userService;
    }

    @Override
    public boolean supports(Class<?> clazz) {
        return User.class.isAssignableFrom(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        User userForm = (User) target;
        try {
            userService.loadUserByUsername(userForm.getUsername());
        } catch (UsernameNotFoundException e) {
            return;
        }
        errors.rejectValue("username", "user.exist", "User already exists (default)");
    }
}

