import Axios from "axios";
import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

export const userSlice = createSlice({
  name: "user",
  initialState: {
    user: {
      id_users: "",
      name: "",
      username: "",
      email: "",
      isAdmin: "",
      level: "",
      imagePath: "",
    },
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;

export function registerData(data) {
  return async () => {
    try {
      const response = await Axios.post(
        "http://10.126.15.197:8002/part/register",
        data
      );

      console.log("Response data:", response.data); // Debugging line

      // Check if the response message indicates success
      if (response.data.message.toLowerCase() === "register success") {
        toast.success("Registration successful!");
      } else {
        toast.error(response.data.message || "Registration failed.");
      }
    } catch (error) {
      toast.error("An error occurred during registration. Please try again.");
      console.error("Error:", error); // Log error for debugging
    }
  };
}


export function loginData(data) {
  return async (dispatch) => {
    try {
      let response = await Axios.post(
        "http://10.126.15.197:8002/part/login",
        data
      );
      
      // If login is successful
      const userData = response.data.data;
      dispatch(setUser(userData));
      // console.log("uyyyyyyyy", userData);
      localStorage.setItem("user_token", response.data.token);

      // Display success message
      toast.success("Login successful!");

      // LOG LOGIN: langsung POST ke endpoint log login di sini
      try {
        const now = new Date().toLocaleString(); // atau sesuai format yang kamu mau
        await Axios.post("http://10.126.15.197:8002/part/LoginData", {
          name: userData.name,
          id: userData.id_users,
          email: userData.email,
          isAdmin: userData.isAdmin,
          level: userData.level,
          imagePath: userData.imagePath ? userData.imagePath : "-",
          loginAt: now,
        });
        // Optional: console.log("Log login berhasil");
      } catch (logErr) {
        // Boleh tampilkan pesan error log login, tapi tidak memblok login utama
        // Optional: console.log("Log login gagal:", logErr);
      }

      // Optional: Redirect user if necessary
      return true; // Indicate success
    } catch (error) {
      // Handle login failure and show error message
      toast.error("Login failed. Please check your credentials.");
      return false; // Indicate failure
    }
  };
}

export function CheckLogin(token) {
  return async (dispatch) => {
    try {
      
    let respons = await Axios.post(
      "http://10.126.15.197:8002/part/check-Login",
      {},
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    if (respons) {
      dispatch(setUser(respons.data.data));

      }
    } catch (error) {
      
    if (error.response && error.response.status === 401) {
      // Jika error 401, hapus token dan arahkan ke halaman login
      localStorage.removeItem("user_token");
      console.log("Token tidak valid, mengarahkan ke halaman login");

      } else {
        console.log("Terjadi kesalahan:", error);
      }
    }
  };
}
