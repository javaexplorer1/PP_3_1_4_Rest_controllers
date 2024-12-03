package ru.kata.spring.boot_security.demo.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;
import ru.kata.spring.boot_security.demo.models.User;
import ru.kata.spring.boot_security.demo.services.RoleServiceImpl;
import ru.kata.spring.boot_security.demo.services.UserDetailsServiceImpl;
import ru.kata.spring.boot_security.demo.validators.UserFormValidator;

import javax.validation.Valid;


@Controller
@RequestMapping("/admin")
public class AdminController {
    private final UserDetailsServiceImpl userService;
    private final RoleServiceImpl roleService;

    @Autowired
    public AdminController(UserDetailsServiceImpl userService, RoleServiceImpl roleService) {
        this.userService = userService;
        this.roleService = roleService;
    }

    @InitBinder
    protected void initBinder(WebDataBinder binder) {
        binder.setValidator(new UserFormValidator(userService)); // Выполнение проверки.
    }

    @GetMapping("/user")
    public String userFromAdminPage(Authentication authentication, Model model) {
        String username = authentication.getName();
        User user = userService.findByUsername(username);
        model.addAttribute("user", user);
        return "admin/user";
    }

    @GetMapping("/users")
    public String getUsers(Authentication authentication, Model model) {
        String username = authentication.getName();
        model.addAttribute("userLogged", userService.findByUsername(username));
        model.addAttribute("users", userService.getUsers());
        model.addAttribute("allRoles", roleService.getRoles());
        model.addAttribute("newUser", new User());
        return "admin/users";
    }

    @PostMapping("/new_user")
    public String createUser(@Valid @ModelAttribute("user") User user, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return "redirect:/admin/users";
        }
        userService.saveUser(user);
        return "redirect:/admin/users";
    }

    @PostMapping("/delete")
    public String deleteUser(@RequestParam("id") Long id) {
        userService.deleteUserById(id);
        return "redirect:/admin/users";
    }


    @PostMapping("/edit")
    public String editUser(@ModelAttribute("user") User user) {
        userService.saveUser(user);
        return "redirect:/admin/users";
    }
}