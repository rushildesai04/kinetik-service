"use client";

import { useRouter } from "next/navigation";
import { Box, Typography, IconButton, Avatar } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { MeshBackground } from "./MeshBackground";
import { PatientNav } from "./PatientNav";
import { PatientSidebar } from "./PatientSidebar";
import { getStoredUser, clearAuth } from "@/lib/api";

interface PatientShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showNav?: boolean;
  fullWidth?: boolean;
}

export function PatientShell({
  children,
  title,
  subtitle,
  showNav = true,
  fullWidth = true,
}: PatientShellProps) {
  const router = useRouter();
  const user = getStoredUser();

  function handleLogout() {
    clearAuth();
    router.push("/");
  }

  const initials = user?.firstName
    ? user.firstName.slice(0, 1).toUpperCase()
    : "?";

  return (
    <Box minHeight="100vh" position="relative" display="flex">
      <MeshBackground />
      {showNav && <PatientSidebar />}

      <Box
        component="main"
        flex={1}
        minWidth={0}
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          pb: showNav ? { xs: 10, md: 0 } : 0,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: fullWidth ? "none" : 960,
            mx: fullWidth ? 0 : "auto",
            px: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6 },
            pt: { xs: 2.5, md: 3.5 },
            pb: { xs: 3, md: 4 },
            flex: 1,
          }}
        >
          {(title || subtitle) && (
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
              mb={{ xs: 2.5, md: 3.5 }}
            >
              <Box>
                {subtitle && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mb={0.5}
                    sx={{ fontSize: { md: "0.8rem" } }}
                  >
                    {subtitle}
                  </Typography>
                )}
                {title && (
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{
                      letterSpacing: "-0.02em",
                      fontSize: { xs: "1.75rem", md: "2rem", lg: "2.25rem" },
                    }}
                  >
                    {title}
                  </Typography>
                )}
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  sx={{
                    width: { xs: 40, md: 44 },
                    height: { xs: 40, md: 44 },
                    background: "linear-gradient(135deg, #00e5c7, #6366f1)",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </Avatar>
                <IconButton onClick={handleLogout} size="small" sx={{ color: "#64748b" }}>
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}
          {children}
        </Box>
      </Box>

      {showNav && <PatientNav />}
    </Box>
  );
}
