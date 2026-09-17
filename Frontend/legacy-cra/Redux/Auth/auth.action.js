// import axios from "axios";
import { LOGIN_ERROR, LOGIN_REQUEST, LOGIN_SUCCESS, LOGOUT, ADMINLOGIN } from "./auth.types";
import { USERS_API_BASE_URL } from "../../config/api";

export const login = (creds) => async (dispatch) => {
  dispatch({ type: LOGIN_REQUEST })
  // console.log(creds,"hii")
  try {
    const response = await fetch(`${USERS_API_BASE_URL}/auth/singleuser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(creds),
    });
    const data = await response.json();

    if (!response.ok) {
      const message = data?.message || "Login failed";
      alert(message);
      dispatch({ type: LOGIN_ERROR, payload: message });
      return;
    }

    if (data.mobile === "0123456789") {
      dispatch({ type: ADMINLOGIN, payload: data });
    }

    alert("Congratulations..!,Login Successfull...!");
    dispatch({ type: LOGIN_SUCCESS, payload: data });
      // console.log(response.data)
      // return data;
     
  }
  catch (e) {
      alert("Something Went Wrong, Please try again later...")
      dispatch({ type: LOGIN_ERROR, payload: e.message })
      console.log(e)
     
  }
}


const authlogout = () => ({type : LOGOUT});

export default authlogout;
