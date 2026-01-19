import { useAuth } from "@clerk/clerk-react";
import React, { useEffect } from "react";
import { thinkSoft } from "#/api/thinksoft-axios";

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
    const { getToken } = useAuth();

    useEffect(() => {
        const interceptorId = thinkSoft.interceptors.request.use(async (config) => {
            const token = await getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        return () => {
            thinkSoft.interceptors.request.eject(interceptorId);
        };
    }, [getToken]);

    return <>{children}</>;
};
