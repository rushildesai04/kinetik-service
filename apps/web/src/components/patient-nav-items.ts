import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";

export const patientNavItems = [
  { label: "Home", href: "/patient", icon: HomeOutlinedIcon },
  { label: "Plan", href: "/patient/plan", icon: AssignmentOutlinedIcon },
  { label: "Metrics", href: "/patient/metrics", icon: BarChartOutlinedIcon },
  { label: "Community", href: "/patient/community", icon: GroupsOutlinedIcon },
  { label: "Support", href: "/patient/support", icon: SupportAgentOutlinedIcon },
] as const;
