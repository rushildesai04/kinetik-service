"use client";

import { usePathname, useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { patientNavItems } from "./patient-nav-items";
import { Logo } from "./Logo";

export function PatientSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      component="aside"
      sx={{
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        width: { md: 240, lg: 260 },
        flexShrink: 0,
        minHeight: "100vh",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        py: 3,
        px: 2,
        borderRight: "1px solid rgba(15,23,42,0.08)",
        bgcolor: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(20px)",
      }}
    >
      <Box mb={4} px={1}>
        <Logo size="sm" />
      </Box>

      <Box component="nav" display="flex" flexDirection="column" gap={0.5} flex={1}>
        {patientNavItems.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/patient" && pathname.startsWith(href));
          return (
            <Box
              key={href}
              onClick={() => router.push(href)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.25,
                borderRadius: 2,
                cursor: "pointer",
                color: active ? "#00967d" : "#64748b",
                bgcolor: active ? "rgba(0, 184, 154, 0.1)" : "transparent",
                border: active ? "1px solid rgba(0,184,154,0.2)" : "1px solid transparent",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: active ? "rgba(0, 184, 154, 0.1)" : "rgba(15,23,42,0.04)",
                  color: active ? "#00967d" : "#0f172a",
                },
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
              <Typography variant="body2" fontWeight={active ? 600 : 500}>
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
