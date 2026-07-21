"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import CheckIcon from "@mui/icons-material/Check";
import { PatientShell } from "@/components/PatientShell";
import { GlassCard } from "@/components/GlassCard";
import {
  nearbyAthletes,
  getConnections,
  toggleConnection,
  getShareLocation,
  setShareLocation,
  getRadius,
  setRadius,
  filterByRadius,
} from "@/lib/community";

export default function CommunityPage() {
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const [shareLocation, setShareLocationState] = useState(true);
  const [radius, setRadiusState] = useState(10);
  const [snack, setSnack] = useState("");

  useEffect(() => {
    setConnections(getConnections());
    setShareLocationState(getShareLocation());
    setRadiusState(getRadius());
  }, []);

  const visibleAthletes = shareLocation ? filterByRadius(nearbyAthletes, radius) : [];

  function handleConnect(id: string, name: string) {
    const connected = toggleConnection(id);
    setConnections(getConnections());
    setSnack(connected ? `Connection request sent to ${name}` : `Disconnected from ${name}`);
  }

  function handleLocationToggle(checked: boolean) {
    setShareLocationState(checked);
    setShareLocation(checked);
    setSnack(checked ? "Location sharing enabled (ZIP-level only)" : "Location sharing turned off");
  }

  function handleRadiusChange(_: React.MouseEvent<HTMLElement>, value: number | null) {
    if (value == null) return;
    setRadiusState(value);
    setRadius(value);
  }

  return (
    <PatientShell title="Community" subtitle="Recovery is faster together">
      <Grid container spacing={{ xs: 2, md: 2.5, lg: 3 }}>
        <Grid item xs={12} lg={4}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Find athletes near you on the same return-to-sport journey.
          </Typography>

          <GlassCard sx={{ p: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={1.5}>
              Search radius
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={radius}
              onChange={handleRadiusChange}
              size="small"
              fullWidth
              sx={{ "& .MuiToggleButton-root": { color: "text.secondary", borderColor: "rgba(15,23,42,0.12)" } }}
            >
              {[5, 10, 25].map((r) => (
                <ToggleButton key={r} value={r} sx={{ "&.Mui-selected": { color: "#00967d", bgcolor: "rgba(0,184,154,0.12)" } }}>
                  {r} mi
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </GlassCard>

          <GlassCard sx={{ p: 2.5, mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={shareLocation}
                  onChange={(e) => handleLocationToggle(e.target.checked)}
                  sx={{ "& .Mui-checked": { color: "#00e5c7" } }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Share approximate location
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ZIP-level only · never precise GPS
                  </Typography>
                </Box>
              }
              sx={{ ml: 0, width: "100%", justifyContent: "space-between" }}
              labelPlacement="start"
            />
          </GlassCard>

          <GlassCard sx={{ p: 2.5, minHeight: { xs: 140, lg: 220 } }}>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Nearby Kinetik athletes
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {shareLocation ? `Within ${radius} mi · ${visibleAthletes.length} active` : "Location hidden"}
                </Typography>
              </Box>
              {shareLocation && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
                  <Typography variant="caption" color="text.secondary">
                    Live
                  </Typography>
                </Box>
              )}
            </Box>
            <Box
              sx={{
                height: { xs: 80, lg: 140 },
                borderRadius: 2,
                background: shareLocation
                  ? "linear-gradient(135deg, rgba(0,229,199,0.15), rgba(99,102,241,0.1))"
                  : "rgba(15,23,42,0.03)",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {!shareLocation ? (
                <Typography variant="caption" color="text.secondary">
                  Enable location to see nearby athletes
                </Typography>
              ) : (
                visibleAthletes.map((a, i) => (
                  <Box
                    key={a.id}
                    sx={{
                      position: "absolute",
                      left: `${15 + i * 20}%`,
                      top: `${25 + (i % 3) * 20}%`,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: connections.has(a.id) ? "#6366f1" : "#00e5c7",
                      boxShadow: "0 0 12px rgba(0,229,199,0.6)",
                    }}
                  />
                ))
              )}
            </Box>
          </GlassCard>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.1em", mb: 2, display: "block" }}>
            People near you
          </Typography>

          {!shareLocation ? (
            <GlassCard sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Turn on location sharing to discover athletes recovering near you.
              </Typography>
            </GlassCard>
          ) : visibleAthletes.length === 0 ? (
            <GlassCard sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No athletes found within {radius} miles. Try expanding your radius.
              </Typography>
            </GlassCard>
          ) : (
            <Grid container spacing={2}>
              {visibleAthletes.map((a) => {
                const connected = connections.has(a.id);
                return (
                  <Grid item xs={12} md={6} key={a.id}>
                    <GlassCard sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, height: "100%" }}>
                      <Box position="relative">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #00e5c7, #6366f1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                          }}
                        >
                          {a.name.split(" ").map((n) => n[0]).join("")}
                        </Box>
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: a.active ? "#10b981" : "#f59e0b",
                            border: "2px solid #ffffff",
                          }}
                        />
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="subtitle2" fontWeight={700}>
                            {a.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {a.distance}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {a.injury} · {a.sport}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Week {a.week} of recovery
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant={connected ? "outlined" : "contained"}
                        startIcon={connected ? <CheckIcon /> : <PersonAddOutlinedIcon />}
                        onClick={() => handleConnect(a.id, a.name)}
                        sx={{ minWidth: 110, fontSize: "0.75rem", flexShrink: 0 }}
                      >
                        {connected ? "Connected" : "Connect"}
                      </Button>
                    </GlassCard>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>
      </Grid>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack("")} message={snack} />
    </PatientShell>
  );
}
