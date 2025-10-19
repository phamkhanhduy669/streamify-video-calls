import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser.js";
import Layout from "./Layout.jsx";

const ProtectedRoute = ({ showSidebar }) => {
    const { authUser } = useAuthUser();

    // Kiểm tra xem người dùng đã đăng nhập và đã onboarding chưa
    if (authUser && authUser.isOnboarded) {
        // Nếu có, render Layout và các component con (HomePage, NotificationsPage...)
        return (
            <Layout showSidebar={showSidebar}>
                <Outlet />
            </Layout>
        );
    }

    // Nếu chưa đăng nhập, chuyển về trang login
    // Nếu đã đăng nhập nhưng chưa onboarding, chuyển về trang onboarding
    return <Navigate to={!authUser ? "/login" : "/onboarding"} />;
};

export default ProtectedRoute;