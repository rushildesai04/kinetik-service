import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";

export const patientNavItems = [
  { label: "Home", href: "/patient", icon: HomeOutlinedIcon },
  { label: "Plan", href: "/patient/plan", icon: AssignmentOutlinedIcon },
  { label: "Metrics", href: "/patient/metrics", icon: BarChartOutlinedIcon },
  { label: "Progress", href: "/patient/progress", icon: EmojiEventsOutlinedIcon },
  { label: "Support", href: "/patient/support", icon: SupportAgentOutlinedIcon },
] as const;
