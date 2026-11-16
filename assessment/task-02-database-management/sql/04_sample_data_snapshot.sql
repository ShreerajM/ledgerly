-- Ledgerly sample data snapshot (pg_dump --data-only --column-inserts) taken 2026-11-17T08:24Z.
-- Contents: 24 users and 53 transactions = the 22 users / 50 transactions loaded by backend/prisma/seed.ts
-- plus the additional records created during API and UAT testing (24 - 22 users, 53 - 50 transactions). Passwords are Argon2 hashes of the published demo passwords.
-- Load after 01_schema.sql:  psql -d ledgerly -f 04_sample_data_snapshot.sql
--
-- PostgreSQL database dump
--

\restrict mXXcNCIftjM5b77a72OHWtpLUB8WJ7m1QvIM1m2XBCi8SUc05TZyqzOgGx7cVMZ

-- Dumped from database version 18.7 (Debian 18.7-1.pgdg13+2)
-- Dumped by pg_dump version 18.7 (Debian 18.7-1.pgdg13+2)


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (2, 'Rohan Deshmukh', 'rohan@example.com', '$argon2id$v=19$m=19456,t=2,p=1$4JdOEf0xWvBsjGLnNvN14w$7N4BuVPhivNSgGDrU/Oid942VGd+qsCQFc5T4XnXLhw', 'admin', true, '2026-11-15 08:21:20.648+00', '2026-07-21 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (4, 'Farah Sheikh', 'farah@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-15 08:21:20.648+00', '2026-08-04 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (5, 'Arjun Naik', 'arjun@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-14 08:21:20.648+00', '2026-08-09 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (6, 'Sneha Patil', 'sneha@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-16 03:21:20.648+00', '2026-08-11 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (7, 'Kabir Joshi', 'kabir@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-13 08:21:20.648+00', '2026-08-13 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (8, 'Isha Rane', 'isha@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-14 08:21:20.648+00', '2026-08-18 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (9, 'Vikram More', 'vikram@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-12 08:21:20.648+00', '2026-08-20 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (10, 'Nisha Gawande', 'nisha@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-15 08:21:20.648+00', '2026-08-23 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (11, 'Aditya Pawar', 'aditya@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-10 08:21:20.648+00', '2026-08-28 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (12, 'Priya Mhatre', 'priya@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-14 08:21:20.648+00', '2026-08-30 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (13, 'Sahil Khan', 'sahil@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-07 08:21:20.648+00', '2026-09-17 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (14, 'Tanvi Gharat', 'tanvi@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-15 20:21:20.648+00', '2026-09-02 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (15, 'Omkar Patil', 'omkar@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-13 08:21:20.648+00', '2026-09-07 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (16, 'Riya Shah', 'riya@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-15 08:21:20.648+00', '2026-09-11 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (17, 'Yash Thakur', 'yash@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-01 08:21:20.648+00', '2026-10-07 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (18, 'Pooja Bhoir', 'pooja@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', false, '2026-09-15 08:21:20.648+00', '2026-07-24 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (19, 'Nikhil Sawant', 'nikhil@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', false, '2026-09-29 08:21:20.648+00', '2026-07-27 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (20, 'Anjali Kadam', 'anjali@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', false, '2026-09-02 08:21:20.648+00', '2026-07-30 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (21, 'Harsh Mehta', 'harsh@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', false, '2026-10-06 08:21:20.648+00', '2026-08-07 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (22, 'Divya Nair', 'divya@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', false, NULL, '2026-10-17 08:21:20.648+00', '2026-11-16 08:21:20.673+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (1, 'Asha Verma', 'asha@example.com', '$argon2id$v=19$m=19456,t=2,p=1$4JdOEf0xWvBsjGLnNvN14w$7N4BuVPhivNSgGDrU/Oid942VGd+qsCQFc5T4XnXLhw', 'admin', true, '2026-11-17 07:20:42.275+00', '2026-07-19 08:21:20.647+00', '2026-11-17 07:20:42.276+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (23, 'Shreeraj Mhatre', 'shrerajmhatre@gmail.com', '$argon2id$v=19$m=19456,t=2,p=1$EqF4eVlI+KDS4dxzdCyF6Q$1L1wZuDu++2BacDHv88SVR8afCHp0N1fpzbKHTkIKXc', 'user', true, '2026-11-16 21:23:01.032+00', '2026-11-16 13:28:27.93+00', '2026-11-16 21:23:01.06+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (24, 'UAT Test User', 'uat.testuser@example.com', '$argon2id$v=19$m=19456,t=2,p=1$I8jLhwvhsP02dbyJ4FlDcw$T96synrfqnDDL/oufTWEBP6xaCpc4YJeX57lI3GmLhk', 'user', true, '2026-11-16 21:57:55.936+00', '2026-11-16 21:47:19.143+00', '2026-11-16 21:57:55.937+00');
INSERT INTO public.users (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at) VALUES (3, 'Meera Kulkarni', 'meera@example.com', '$argon2id$v=19$m=19456,t=2,p=1$VjZxbeNO16Vz26i6JtopJg$T+SVyUy0Jb7Dj3/UCJpXIVmuisl6oInGWePjNsaxxTM', 'user', true, '2026-11-16 22:10:15.854+00', '2026-07-29 08:21:20.648+00', '2026-11-16 22:10:15.854+00');


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (1, 7, 8450.00, 'success', '', '2026-09-20 04:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (2, 6, 22100.00, 'success', 'Invoice INV-2011', '2026-09-21 23:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (3, 3, 3200.00, 'success', '', '2026-09-23 06:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (4, 5, 15750.50, 'success', '', '2026-09-24 21:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (5, 4, 640.00, 'failed', 'Card declined', '2026-09-26 02:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (6, 1, 31000.00, 'success', 'Invoice INV-2019', '2026-09-28 05:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (7, 2, 12800.00, 'success', '', '2026-09-29 18:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (8, 8, 4999.00, 'success', '', '2026-10-01 00:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (9, 9, 27500.00, 'success', '', '2026-10-03 03:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (10, 10, 1850.75, 'success', '', '2026-10-03 22:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (11, 11, 9600.00, 'failed', 'Gateway timeout', '2026-10-06 01:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (12, 12, 18200.00, 'success', '', '2026-10-07 07:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (13, 15, 5400.00, 'success', '', '2026-10-08 20:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (14, 16, 36900.00, 'success', 'Invoice INV-2027', '2026-10-09 23:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (15, 14, 2750.00, 'success', '', '2026-10-12 04:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (16, 7, 14300.00, 'success', '', '2026-10-12 17:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (17, 3, 6100.00, 'success', '', '2026-10-14 02:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (18, 6, 48000.00, 'success', 'Invoice INV-2031', '2026-10-15 06:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (19, 5, 7250.00, 'success', '', '2026-10-18 00:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (20, 4, 19900.00, 'success', '', '2026-10-18 19:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (21, 1, 2400.00, 'success', '', '2026-10-20 03:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (22, 2, 33500.00, 'failed', 'Gateway timeout', '2026-10-20 22:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (23, 8, 11250.00, 'success', '', '2026-10-22 05:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (24, 9, 8800.00, 'success', '', '2026-10-23 16:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (25, 10, 4100.00, 'success', '', '2026-10-25 01:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (26, 11, 26700.00, 'success', 'Invoice INV-2038', '2026-10-25 21:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (27, 12, 1500.00, 'success', '', '2026-10-27 06:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (28, 15, 15600.00, 'success', '', '2026-10-28 23:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (29, 16, 9300.00, 'failed', 'Card declined', '2026-10-29 18:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (30, 14, 21000.00, 'success', '', '2026-10-31 04:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (31, 7, 3850.00, 'success', '', '2026-10-31 20:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (32, 3, 12950.00, 'success', '', '2026-11-02 02:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (33, 6, 5600.00, 'success', '', '2026-11-03 15:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (34, 5, 29400.00, 'success', 'Invoice INV-2044', '2026-11-05 00:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (35, 4, 7700.00, 'success', '', '2026-11-06 05:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (36, 1, 16400.00, 'success', '', '2026-11-06 21:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (37, 2, 8250.00, 'success', '', '2026-11-09 13:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (38, 8, 21000.00, 'failed', 'Gateway timeout', '2026-11-10 06:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (39, 9, 3675.50, 'success', '', '2026-11-11 01:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (40, 10, 46900.00, 'success', 'Invoice INV-2049', '2026-11-11 17:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (41, 11, 7450.00, 'failed', 'Card declined', '2026-11-12 07:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (42, 12, 5800.00, 'success', '', '2026-11-12 23:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (43, 15, 18200.00, 'success', '', '2026-11-13 12:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (44, 16, 2999.00, 'failed', 'Gateway timeout', '2026-11-14 03:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (45, 14, 31500.00, 'success', '', '2026-11-14 14:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (46, 7, 1250.00, 'failed', 'Card declined', '2026-11-15 02:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (47, 3, 12400.00, 'pending', '', '2026-11-15 12:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (48, 1, 9800.00, 'pending', 'Invoice INV-2056', '2026-11-15 21:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (49, 6, 6400.00, 'pending', '', '2026-11-16 03:21:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (50, 4, 15000.00, 'pending', '', '2026-11-16 06:51:20.678+00', '2026-11-16 08:21:20.689+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (51, 3, 1.50, 'pending', 'smoke test', '2026-11-16 08:21:41.123+00', '2026-11-16 08:21:41.123+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (52, 23, 20000.00, 'pending', 'Test', '2026-11-16 13:38:25.42+00', '2026-11-16 13:38:25.42+00');
INSERT INTO public.transactions (id, user_id, amount, status, note, created_at, updated_at) VALUES (53, 1, 123.45, 'pending', 'Task 3 Postman verification', '2026-11-16 19:46:42.463+00', '2026-11-16 19:46:42.463+00');


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_id_seq', 53, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 25, true);


--
-- PostgreSQL database dump complete
--

\unrestrict mXXcNCIftjM5b77a72OHWtpLUB8WJ7m1QvIM1m2XBCi8SUc05TZyqzOgGx7cVMZ

