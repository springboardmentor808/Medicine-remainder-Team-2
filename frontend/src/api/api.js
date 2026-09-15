import axios from "axios";


// ============================================================
// AXIOS API INSTANCE
// ============================================================

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    timeout: 120000,
});


// ============================================================
// PUBLIC API ENDPOINTS
// These endpoints do not require an access token.
// ============================================================

const publicUrls = [
    "accounts/login/",
    "accounts/register/",
    "accounts/forgot-password/",
    "accounts/reset-password/",
    "accounts/token/refresh/",
];


// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
    (config) => {

        const currentUrl = config.url || "";

        const isPublicApi = publicUrls.some(
            (url) => currentUrl.includes(url)
        );


        // ----------------------------------------------------
        // ADD ACCESS TOKEN
        // ----------------------------------------------------

        if (!isPublicApi) {

            const accessToken =
                localStorage.getItem("access");

            if (accessToken) {

                config.headers =
                    config.headers || {};

                config.headers.Authorization =
                    `Bearer ${accessToken}`;
            }
        }


        // ----------------------------------------------------
        // HANDLE FORM DATA
        // ----------------------------------------------------

        if (
            config.data instanceof FormData
        ) {

            config.headers =
                config.headers || {};

            delete config.headers["Content-Type"];
        }


        return config;
    },

    (error) => {

        return Promise.reject(error);
    }
);


// ============================================================
// RESPONSE INTERCEPTOR
// Handles expired JWT access tokens.
// ============================================================

api.interceptors.response.use(

    (response) => {

        return response;
    },


    async (error) => {

        const originalRequest =
            error.config;

        const status =
            error.response?.status;


        // ----------------------------------------------------
        // ONLY HANDLE 401
        // ----------------------------------------------------

        if (
            status !== 401 ||
            !originalRequest
        ) {

            return Promise.reject(error);
        }


        // ----------------------------------------------------
        // DO NOT RETRY SAME REQUEST MORE THAN ONCE
        // ----------------------------------------------------

        if (
            originalRequest._retry
        ) {

            return Promise.reject(error);
        }


        originalRequest._retry = true;


        // ----------------------------------------------------
        // GET REFRESH TOKEN
        // ----------------------------------------------------

        const refreshToken =
            localStorage.getItem("refresh");


        if (!refreshToken) {

            console.warn(
                "No refresh token available."
            );

            return Promise.reject(error);
        }


        try {

            console.log(
                "Access token expired. Refreshing..."
            );


            // ------------------------------------------------
            // REFRESH TOKEN REQUEST
            //
            // Use axios directly instead of api.post()
            // to prevent the refresh request from triggering
            // the same interceptor again.
            // ------------------------------------------------

            const refreshResponse =
                await axios.post(
                    "http://127.0.0.1:8000/api/accounts/token/refresh/",
                    {
                        refresh: refreshToken,
                    },
                    {
                        timeout: 120000,
                    }
                );


            const newAccessToken =
                refreshResponse.data?.access;


            // ------------------------------------------------
            // CHECK NEW ACCESS TOKEN
            // ------------------------------------------------

            if (!newAccessToken) {

                throw new Error(
                    "New access token was not returned."
                );
            }


            // ------------------------------------------------
            // SAVE NEW ACCESS TOKEN
            // ------------------------------------------------

            localStorage.setItem(
                "access",
                newAccessToken
            );


            console.log(
                "New access token saved."
            );


            // ------------------------------------------------
            // UPDATE ORIGINAL REQUEST
            // ------------------------------------------------

            originalRequest.headers =
                originalRequest.headers || {};

            originalRequest.headers.Authorization =
                `Bearer ${newAccessToken}`;


            // ------------------------------------------------
            // RETRY ORIGINAL REQUEST
            // ------------------------------------------------

            return api(
                originalRequest
            );

        } catch (refreshError) {

            console.error(
                "Token refresh failed:",
                refreshError.response?.data ||
                refreshError.message
            );


            // ------------------------------------------------
            // CLEAR LOGIN DATA
            // ------------------------------------------------

            localStorage.removeItem(
                "access"
            );

            localStorage.removeItem(
                "refresh"
            );

            localStorage.removeItem(
                "username"
            );

            localStorage.removeItem(
                "user_id"
            );

            localStorage.removeItem(
                "role"
            );


            return Promise.reject(
                refreshError
            );
        }
    }
);


// ============================================================
// EXPORT
// ============================================================

export default api;