INSERT INTO users(age, email, password, username)
VALUES (35, 'user1@mail.ru', '$2y$10$uRfNL/FLX2ZMGQv7Yp/VGuy1D7puFvgecFbABtfCqTB1Y8p5B80em', 'user'),
       (45, 'admin@mail.ru', '$2y$10$ZeKY0xYeC05lEMN12g7rr.NLTUXeYnUZN0JZrw/SWHz2TWh41pmAu', 'admin');

INSERT INTO roles(role)
VALUES ('ROLE_USER'), ('ROLE_ADMIN');

INSERT INTO users_roles(user_id, role_id)
VALUES (1, 1), (2,2), (2,1);




