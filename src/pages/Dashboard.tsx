//    src/pages/Dashboard.tsx

import { authFetch } from "@/lib/authFetch";
import { getBaseUrl } from "@/config/backend";

import { motion, AnimatePresence } from "framer-motion";
import { useConversions } from "@/hooks/useConversions";
import { useActivity } from "@/hooks/useActivity";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    getUserProfile,
    uploadProfilePicture,
    getProfilePictureUrl,
} from "@/api/user";

import { conversionOptions } from "@/lib/conversionOptions";

const iconShade =
    "p-3 rounded-lg bg-gray-100/70 group-hover:bg-gray-200/80 transition-colors";

const conversionLabelMap = new Map(
    conversionOptions.map(opt => [opt.id, opt.label])
);
import {
    ArrowRight,
    Clock3,
    Database,
    Star,
    Crown,
    FileText,
    Bot,
    ScanText,
    FileSearch,
    Rocket,
    Brain,
    Zap,
    ShieldCheck,
    TableProperties,
} from "lucide-react";

import { useMsal } from "@azure/msal-react";
import { Button } from "@/components/ui/button";
import { SubpageHeader } from "@/components/SubpageHeader";

export default function Dashboard() {
    const cardGlow =
        "border-2 border-blue-600/40 hover:border-blue-600 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.30)]";

    const { accounts } = useMsal();
    const navigate = useNavigate();

    const { conversions, loading } = useConversions();
    const { activity, monthly, mostUsed, summary } = useActivity();


    const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
    const [profileVersion, setProfileVersion] = useState<number>(0);

    // ---------------------------------------------------
    // SAFE FALLBACKS
    // ---------------------------------------------------
    const safeConversions = conversions ?? [];
    const recentConversions = Array.isArray(safeConversions)
        ? safeConversions.slice(0, 3)
        : [];

    const account = accounts?.[0];

    const displayName =
        (typeof account?.name === "string" && account.name) ||
        (typeof account?.idTokenClaims?.name === "string" && account.idTokenClaims.name) ||
        (typeof account?.idTokenClaims?.given_name === "string" && account.idTokenClaims.given_name) ||
        "User";

    const userEmail =
        (typeof account?.idTokenClaims?.email === "string" && account.idTokenClaims.email) ||
        (typeof account?.idTokenClaims?.preferred_username === "string" && account.idTokenClaims.preferred_username) ||
        (typeof account?.username === "string" && account.username) ||
        "";

    // ---------------------------------------------------
    // QUICK ACTIONS
    // ---------------------------------------------------
    const quickActions = useMemo(() => {
        return [...conversionOptions]
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
    }, []);



    // ---------------------------------------------------
    // CONVERSION LABELS
    // ---------------------------------------------------

    const getConversionLabel = (item: any) => {
        const key =
            item.conversion_type ||
            item.tool_id ||
            item.action ||
            item.source_format + "_to_" + item.target_format;

        if (key) {
            const label = conversionLabelMap.get(key);
            if (label) return label;
        }

        if (item.source_format && item.target_format) {
            return `${item.source_format.toUpperCase()} → ${item.target_format.toUpperCase()}`;
        }

        return "PDF Action";
    };


    // ====================================================
    // 🔥 DOWNLOAD CONVERTED FILE
    // ====================================================
    const handleDownload = async (item: any) => {
        const blobPath = item?.converted_blob_path;

        if (!blobPath) {
            console.warn("Missing converted_blob_path", item);
            return;
        }

        try {
            const res = await authFetch(
                `${getBaseUrl()}/api/files/download?container=converted&blob=${encodeURIComponent(
                    item.converted_blob_path
                )}`
            );

            if (!res.ok) {
                throw new Error(`Download failed: ${res.status}`);
            }

            const blob = await res.blob();

            let filename = item.original_filename || "file";

            const disposition = res.headers.get("Content-Disposition");
            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match?.[1]) filename = match[1];
            }

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
        }
    };

    // ====================================================
    // 🔁 REUSE SAME FILE FOR CONVERSION
    // ====================================================
    const handleReuse = async (item: any) => {
        try {
            const res = await authFetch(
                `${getBaseUrl()}/api/files/download?container=converted&blob=${encodeURIComponent(
                    item.converted_blob_path
                )}`
            );

            if (!res.ok) {
                throw new Error("Failed to fetch file");
            }

            const blob = await res.blob();

            const file = new File(
                [blob],
                item.original_filename || "file",
                { type: blob.type }
            );

            // SAME PATTERN AS CONVERT PAGE
            navigate("/", {
                state: {
                    reusedFile: file,
                },
            });

            // trigger popup behavior like convert page expects
            sessionStorage.setItem("openPopupAfterNav", "1");

        } catch (err) {
            console.error("Reuse failed:", err);
            alert("Failed to load file for conversion");
        }
    };


    // ---------------------------------------------------
    // PROFILE PICTURE HANDLER
    // ---------------------------------------------------

    const handleProfilePicChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // optional optimistic preview
            const previewUrl = URL.createObjectURL(file);
            setProfilePicUrl(previewUrl);

            const res = await uploadProfilePicture(file);

            if (res?.profile_picture) {
                const blob = await getProfilePictureUrl();
                const imageUrl = URL.createObjectURL(blob);

                setProfilePicUrl(imageUrl);

                // force refresh everywhere
                setProfileVersion(v => v + 1);
            }

        } catch (err) {
            console.error("Upload failed:", err);
            alert("Failed to upload profile picture");
        }
    };


    // ---------------------------------------------------
    // NEW FEATURES ANIMATION
    // ---------------------------------------------------
    const featurePool = [
        {
            id: 1,
            text: "AI Document Summaries",
            icon: Bot,
            iconColor: "text-blue-600",
            className: "bg-blue-50 border-blue-100",
        },
        {
            id: 2,
            text: "AI-Powered OCR Improvements",
            icon: ScanText,
            iconColor: "text-purple-600",
            className: "bg-purple-50 border-purple-100",
        },
        {
            id: 3,
            text: "AI Data Extraction from PDFs",
            icon: FileSearch,
            iconColor: "text-emerald-600",
            className: "bg-emerald-50 border-emerald-100",
        },
        {
            id: 4,
            text: "Premium Upload Limit Increased",
            icon: Rocket,
            iconColor: "text-amber-600",
            className: "bg-amber-50 border-amber-100",
        },
        {
            id: 5,
            text: "Smart PDF Auto Formatting",
            icon: Brain,
            iconColor: "text-pink-600",
            className: "bg-pink-50 border-pink-100",
        },
        {
            id: 6,
            text: "Faster Batch Conversions",
            icon: Zap,
            iconColor: "text-cyan-600",
            className: "bg-cyan-50 border-cyan-100",
        },
        {
            id: 7,
            text: "Secure File Encryption",
            icon: ShieldCheck,
            iconColor: "text-indigo-600",
            className: "bg-indigo-50 border-indigo-100",
        },
        {
            id: 8,
            text: "AI Table Detection",
            icon: TableProperties,
            iconColor: "text-orange-600",
            className: "bg-orange-50 border-orange-100",
        },
    ];

    const [visibleFeatures, setVisibleFeatures] = useState(
        featurePool.slice(0, 4)
    );

    useEffect(() => {
        const interval = setInterval(() => {
            const shuffled = [...featurePool]
                .sort(() => Math.random() - 0.5)
                .slice(0, 4);

            setVisibleFeatures(shuffled);
        }, 3500);

        return () => clearInterval(interval);
    }, []);

    // FOR PROFILE PICTURE

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await getUserProfile();

                if (data?.profile_picture) {
                    const blob = await getProfilePictureUrl();
                    const imageUrl = URL.createObjectURL(blob);

                    setProfilePicUrl(imageUrl);
                } else {
                    setProfilePicUrl(null);
                }
            } catch (err) {
                console.error("Failed to load profile:", err);
            }
        };

        loadProfile();
    }, [profileVersion]);


    useEffect(() => {
        return () => {
            if (profilePicUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(profilePicUrl);
            }
        };
    }, [profilePicUrl]);


    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative min-h-screen bg-gray-50 overflow-x-hidden"
        >
            <SubpageHeader />

            <div className="max-w-7xl mx-auto px-4 pt-14 pb-10">

                {/* PAGE TITLE */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Dashboard
                    </h1>

                    <p className="text-gray-500 mt-2">
                        Manage your conversions, and files.
                    </p>
                </div>

                {/* HERO */}
                <section
                    id="dashboard-hero"
                    className="
        relative overflow-hidden
        rounded-3xl
        bg-gradient-to-r from-blue-600 to-purple-600
        text-white
        p-8
        shadow-xl
        border border-gray-400
    "
                >
                    <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* LEFT */}
                        <div className="flex flex-col justify-between h-[300px] pr-0">
                            <div>
                                <p className="text-blue-100 mb-2">
                                    Welcome Back 👋
                                </p>

                                <h2 className="text-4xl font-bold">
                                    {displayName}
                                </h2>

                                <p className="text-white/75 text-sm mt-1">
                                    {userEmail}
                                </p>

                                {/* PROFILE PICTURE (square + centered upload below) */}
                                <div className="mt-4 flex flex-col items-start gap-2">

                                    <div className="w-[120px] h-[120px] rounded-lg border-2 border-white overflow-hidden">
                                        <img
                                            src={
                                                profilePicUrl ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`
                                            }
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src =
                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;
                                            }}
                                            className="w-full h-full object-cover"
                                            alt="Profile"
                                        />
                                    </div>

                                    <label className="w-[120px] text-center text-xs text-white/80 cursor-pointer underline hover:text-white">
                                        Change photo
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleProfilePicChange}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* HORIZONTALLY ALIGNED BUTTONS (LEFT EDGE MATCHES PROFILE PICTURE) */}
                            <div className="mt-6 w-full flex justify-center">
                                <div className="flex gap-3">
                                    <Button
                                        className="
                w-[165px]
                font-bold
                bg-gray-100
                text-gray-800
                border border-gray-600
                shadow-[0_4px_10px_rgba(0,0,0,0.10)]
                hover:bg-white
                hover:text-gray-900
                hover:border-gray-600
            "
                                        onClick={() => {
                                            sessionStorage.setItem("openPopupAfterNav", "1");
                                            sessionStorage.setItem("scrollTarget", "hero-top");
                                            sessionStorage.setItem("showDropzonePrompt", "1");
                                            window.dispatchEvent(new Event("highlight-dropzone"));
                                            navigate("/");
                                        }}
                                    >
                                        Start  Conversion
                                    </Button>

                                    <Button
                                        className="
                w-[165px]
                font-bold
                bg-gray-100
                text-gray-800
                border border-gray-600
                shadow-[0_4px_10px_rgba(0,0,0,0.10)]
                hover:bg-white
                hover:text-gray-900
                hover:border-gray-600
            "
                                        onClick={() => navigate("/convert?tab=history")}
                                    >
                                        Conversion History
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* MIDDLE */}
                        <div
                            className="
        bg-white text-gray-900
        rounded-2xl
        border-2 border-gray-500
        p-5
        flex flex-col
        h-[300px]
        overflow-y-auto
    "
                        >
                            <h3 className="font-semibold mb-3 shrink-0">
                                Recent Conversions
                            </h3>

                            <div className="overflow-y-auto space-y-2 pr-1">
                                {loading ? (
                                    <p className="text-sm text-gray-500">
                                        Loading...
                                    </p>
                                ) : recentConversions.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        No recent conversions
                                    </p>
                                ) : (
                                    recentConversions.map(item => (
                                        <div
                                            key={item.id}
                                            className="border-b py-2"
                                        >
                                            <p className="text-xs font-bold truncate">
                                                {item.original_filename}
                                            </p>

                                            <p className="text-sm text-gray-500">
                                                {getConversionLabel(item)}
                                            </p>

                                            <p className="text-xs text-gray-400">
                                                {item.created_date
                                                    ? new Date(item.created_date).toLocaleString()
                                                    : ""}
                                            </p>


                                            <div className="flex gap-3 mt-2 text-xs">
                                                <button
                                                    onClick={() => handleDownload(item)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Download
                                                </button>

                                                <button
                                                    onClick={() => handleReuse(item)}
                                                    className="text-green-600 hover:underline"
                                                >
                                                    Convert
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div
                            className="
        bg-white text-gray-900
        rounded-2xl
        border-2 border-gray-500
        p-5
        h-[300px]
        overflow-hidden
    "
                        >
                            <h3 className="font-semibold mb-3">
                                New Features
                            </h3>

                            <div className="space-y-2 text-sm relative">
                                <AnimatePresence mode="popLayout">
                                    {visibleFeatures.map((feature) => {
                                        const Icon = feature.icon;

                                        return (
                                            <motion.div
                                                key={feature.id}
                                                layout
                                                initial={{
                                                    opacity: 0,
                                                    y: 12,
                                                    scale: 0.98,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: -12,
                                                    scale: 0.98,
                                                }}
                                                transition={{
                                                    duration: 0.45,
                                                    layout: {
                                                        duration: 0.6,
                                                    },
                                                }}
                                                className={`
                ${feature.className}
                border
                rounded-lg
                p-3
                shadow-sm
            `}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon
                                                        className={`w-5 h-5 shrink-0 ${feature.iconColor}`}
                                                    />

                                                    <span>{feature.text}</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>

                    </div>
                </section>

                {/* QUICK ACTIONS */}
                <section className="mt-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Quick Actions
                        </h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {quickActions.map(action => {
                            const Icon = action?.icon ?? FileText;

                            return (
                                <button
                                    key={action.id}
                                    onClick={() => {
                                        sessionStorage.setItem("scrollTarget", "hero-top");

                                        navigate("/", {
                                            state: {
                                                quickAction: true,
                                                quickActionType: action.id,
                                            },
                                        });
                                    }}
                                    className={`
group
bg-white
rounded-2xl
shadow-md
min-h-[110px]
px-5 py-3
text-left
hover:-translate-y-1
transition-all duration-300
${cardGlow}
`}
                                >
                                    <div className="flex items-center gap-3">

                                        <div className="p-2 rounded-xl bg-muted/80 group-hover:bg-primary/10 transition-colors">
                                            <Icon className="w-5 h-5 text-blue-700 group-hover:text-primary transition-colors" />
                                        </div>

                                        <span className="font-semibold">
                                            {action.label}
                                        </span>

                                        <span className="ml-auto flex items-center gap-1 text-sm text-gray-500">
                                            Open Tool
                                            <ArrowRight className="w-4 h-4" />
                                        </span>

                                    </div>                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* ACTIVITY */}
                <section className="mt-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Activity
                        </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">

                        {/* Files Converted */}
                        <div className="bg-white rounded-2xl h-[110px] shadow-lg px-5 py-3 border-2 border-blue-600/40 hover:border-blue-600/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.30)]">

                            <div className="flex items-center gap-3 mb-2">

                                <div className="p-2 rounded-xl bg-muted/80">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>

                                <span className="text-gray-500 text-sm font-medium">
                                    Files Converted
                                </span>

                            </div>

                            <div className="text-2xl font-bold">
                                {activity?.total_conversions != null
                                    ? activity.total_conversions
                                    : "—"}
                            </div>

                        </div>
                        {/* This Month */}
                        <div className="bg-white rounded-2xl h-[110px] shadow-lg px-5 py-3 border-2 border-blue-600/40 hover:border-blue-600/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.30)]">

                            <div className="flex items-center gap-3 mb-2">

                                <div className="p-2 rounded-xl bg-muted/80">
                                    <Clock3 className="w-5 h-5 text-purple-600" />
                                </div>

                                <span className="text-gray-500 text-sm font-medium">
                                    This Month
                                </span>

                            </div>

                            <div className="text-2xl font-bold">
                                {monthly?.total_conversions != null
                                    ? monthly.total_conversions
                                    : "—"}
                            </div>

                        </div>

                        {/* Data Processed */}
                        <div className="bg-white rounded-2xl h-[110px] shadow-lg px-5 py-3 border-2 border-blue-600/40 hover:border-blue-600/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.30)]">

                            <div className="flex items-center gap-3 mb-2">

                                <div className="p-2 rounded-xl bg-muted/80">
                                    <Database className="w-5 h-5 text-emerald-600" />
                                </div>

                                <span className="text-gray-500 text-sm font-medium">
                                    Data Processed
                                </span>

                            </div>

                            <div className="text-2xl font-bold">
                                {typeof summary?.data_processed_mb === "number"
                                    ? summary.data_processed_mb.toFixed(2)
                                    : "0"}{" "}
                                MB
                            </div>

                        </div>

                        {/* Most Used */}
                        <div className="bg-white rounded-2xl h-[110px] shadow-lg px-5 py-3 border-2 border-blue-600/40 hover:border-blue-600/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.30)]">

                            <div className="flex items-center gap-3 mb-2">

                                <div className="p-2 rounded-xl bg-muted/80">
                                    <Star className="w-5 h-5 text-amber-500" />
                                </div>

                                <span className="text-gray-500 text-sm font-medium">
                                    Most Used
                                </span>

                            </div>

                            <div className="text-2xl font-bold">
                                {mostUsed?.most_used != null
                                    ? mostUsed.most_used
                                        .split("_")
                                        .map((word, index) => {
                                            if (word.toLowerCase() === "pdf") return "PDF";
                                            if (word.toLowerCase() === "to") return "to";
                                            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                                        })
                                        .join(" ")
                                    : "—"}
                            </div>

                        </div>

                    </div>
                </section>

                {/* PLAN */}
                <section className="mt-10 flex justify-end">
                    <div
                        className="
        w-[300px]
        bg-gradient-to-r from-blue-600 to-purple-600
        text-white
        p-6
        rounded-2xl
        border border-gray-400
    "
                    >
                        <Crown className="w-6 h-6 mb-3" />

                        <h2 className="font-bold text-xl">
                            Free Plan
                        </h2>

                        <p className="text-blue-100 mt-2">
                            {monthly?.total_conversions != null
                                ? monthly.total_conversions
                                : 0}{" "}
                            conversions this month
                        </p>
                    </div>
                </section>

            </div>
        </motion.section>
    );
}