"use client";

import { usePathname, useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { patientNavItems } from "./patient-nav-items";

export function PatientNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box
      component="nav"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: { xs: "flex", md: "none" },
        justifyContent: "space-around",
        alignItems: "center",
        py: 1,
        px: 1,
        pb: "max(8px, env(safe-area-inset-bottom))",
        background: "rgba(6, 10, 18, 0.92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {patientNavItems.map(({ label, href, icon: Icon }) => {
        const active =
          pathname === href || (href !== "/patient" && pathname.startsWith(href));
        return (
          <Box
            key={href}
            onClick={() => router.push(href)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.25,
              py: 0.75,
              px: 1.5,
              borderRadius: 2,
              cursor: "pointer",
              color: active ? "#00e5c7" : "#64748b",
              transition: "color 0.2s",
              "&:hover": { color: active ? "#00e5c7" : "#94a3b8" },
            }}
          >
            <Icon sx={{ fontSize: 22 }} />
            <Typography variant="caption" fontWeight={active ? 600 : 400} fontSize="0.65rem">
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
