import { useAuth } from "@clerk/clerk-react";
import React, { useEffect } from "react";
import { openHands } from "#/api/open-hands-axios";

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
    const { getToken } = useAuth();

    useEffect(() => {
        const interceptorId = openHands.interceptors.request.use(async (config) => {
            const token = await getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        return () => {
            openHands.interceptors.request.eject(interceptorId);
        };
    }, [getToken]);

    return <>{children}</>;
};
