# Mobifone Manager Dashboard

Hệ thống dashboard quản lý thuê bao Mobifone, gồm backend (Node.js + Express + MySQL) và frontend (React).  
Hỗ trợ xem, lọc, tìm kiếm, phân trang, biểu đồ dữ liệu thuê bao.

---

## 1. Cấu trúc dự án

```
project/
├── backend/         # Node.js + Express + MySQL
│   ├── index.js
│   ├── db.js
│   └── ...
├── src/             # React frontend
│   ├── App.tsx
│   ├── components/
│   └── ...
├── package.json
└── README.md
```

---

## 2. Cài đặt & chạy dự án

### Backend

1. **Cài đặt package:**
    ```sh
    cd backend
    npm install
    ```

2. **Cấu hình kết nối MySQL:**  
   Sửa file `db.js` cho đúng thông tin user, password, database, port.

3. **Chạy backend:**
    ```sh
    node index.js
    ```
   - Mặc định chạy ở `http://localhost:3000`
   - Đảm bảo MySQL/MariaDB đang chạy (có thể dùng XAMPP).

---

### Frontend

1. **Cài đặt package:**
    ```sh
    cd ..
    npm install
    ```

2. **Chạy frontend:**
    ```sh
    npm start
    ```
   - Mặc định chạy ở `http://localhost:3001` hoặc `http://localhost:5173` (nếu dùng Vite).

3. **Cấu hình endpoint API:**  
   Nếu backend không chạy trên localhost, sửa các URL trong `App.tsx` cho đúng IP/backend server.

---

## 3. Deploy lên GitHub

### Bước 1: Khởi tạo git (nếu chưa có)

```sh
git init
git add .
git commit -m "Initial commit"
```

### Bước 2: Tạo repository trên GitHub

- Truy cập [https://github.com/new](https://github.com/new)
- Đặt tên repo, nhấn **Create repository**

### Bước 3: Kết nối local với GitHub

```sh
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

> **Lưu ý:**  
> - Thay `<your-username>` và `<your-repo>` bằng thông tin của bạn.
> - Nếu repo đã có từ trước, chỉ cần `git add .`, `git commit`, `git push`.

---

## 4. Một số lệnh git cơ bản

```sh
git status
git add .
git commit -m "Nội dung commit"
git push
```

---

## 5. Liên hệ & hỗ trợ

Nếu gặp lỗi hoặc cần hỗ trợ, hãy tạo issue trên GitHub hoặc liên hệ trực tiếp.

---

**Chúc bạn thành công!**