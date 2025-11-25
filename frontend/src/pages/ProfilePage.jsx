import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "../lib/api";
import PageLoader from "../components/PageLoader";
import { LANGUAGES, LANGUAGE_TO_FLAG } from "../constants";
import { ShuffleIcon, MapPinIcon, Globe } from "lucide-react";
import { capitialize } from "../lib/utils";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: getProfile, retry: false });

  const [form, setForm] = useState({
    fullName: "",
    bio: "",
    profilePic: "",
    nativeLanguage: "",
    targetLanguage: "", // State cho ngôn ngữ đích
    learningLanguage: "",
    location: "",
    enableTranslation: true, // State cho nút bật/tắt
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.setQueryData(["profile"], res);
      queryClient.invalidateQueries({ queryKey: ["users", "friends"] });
      toast.success("Profile updated successfully");
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "Could not update profile";
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (!data?.user) return;
    const user = data.user;
    setForm({
      fullName: user.fullName || "",
      bio: user.bio || "",
      profilePic: user.profilePic || "",
      nativeLanguage: user.nativeLanguage || "",
      // Nếu chưa có target, mặc định để rỗng (logic sẽ tự fallback về native)
      targetLanguage: user.targetLanguage || "", 
      learningLanguage: user.learningLanguage || "",
      location: user.location || "",
      // Mặc định là true nếu chưa có trong DB
      enableTranslation: user.enableTranslation ?? true, 
    });
  }, [data]);

  if (isLoading) return <PageLoader />;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({
      ...s,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate(form);
  }

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1; 
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    setForm((s) => ({ ...s, profilePic: randomAvatar }));
    toast.success("Random profile picture generated");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Avatar */}
        <div className="col-span-1">
          <div className="card p-4 bg-base-100 shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="size-32 rounded-full overflow-hidden bg-base-300 ring-2 ring-base-200">
                <img
                  src={form.profilePic || "/i.png"}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (e.currentTarget.src.endsWith("/i.png")) return;
                    e.currentTarget.src = "/i.png";
                  }}
                />
              </div>

              <button type="button" onClick={handleRandomAvatar} className="btn btn-sm btn-accent w-full">
                <ShuffleIcon className="size-4 mr-2" />
                Random Avatar
              </button>

              <div className="text-center w-full">
                <h3 className="text-lg font-bold truncate">{form.fullName || "Unknown"}</h3>
                <p className="text-sm opacity-70 truncate">{form.location || "No location"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Form thông tin */}
        <div className="col-span-2">
          <form onSubmit={handleSubmit} className="card p-6 bg-base-100 shadow-sm space-y-6">
            
            {/* Nhóm 1: Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                Basic Info
              </h3>
              
              <div>
                <label className="label">Full name</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} className="input input-bordered w-full" placeholder="John Doe" />
              </div>

              <div>
                <label className="label">Bio</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} className="textarea textarea-bordered w-full h-24 resize-none" placeholder="Tell us about yourself..." />
              </div>

              <div>
                <label className="label">Location</label>
                <div className="relative">
                  <MapPinIcon className="absolute top-1/2 -translate-y-1/2 left-3 size-5 text-base-content/50" />
                  <input name="location" value={form.location} onChange={handleChange} className="input input-bordered w-full pl-10" placeholder="City, Country" />
                </div>
              </div>
            </div>

            {/* Nhóm 2: Ngôn ngữ (Native & Learning) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                Languages
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Native Language */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Native Language</span>
                  </label>
                  <div className="relative">
                    {form.nativeLanguage && LANGUAGE_TO_FLAG[form.nativeLanguage] && (
                      <img
                        src={`https://flagcdn.com/20x15/${LANGUAGE_TO_FLAG[form.nativeLanguage]}.png`}
                        alt="flag"
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-auto"
                      />
                    )}
                    <select
                      name="nativeLanguage"
                      value={form.nativeLanguage}
                      onChange={handleChange}
                      className={`select select-bordered w-full ${form.nativeLanguage ? "pl-10" : ""}`}
                    >
                      <option value="">Select your native language</option>
                      {LANGUAGES.map((lang) => (
                        <option key={`native-${lang}`} value={lang.toLowerCase()}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Learning Language */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Learning Language</span>
                  </label>
                  <div className="relative">
                    {form.learningLanguage && LANGUAGE_TO_FLAG[form.learningLanguage] && (
                      <img
                        src={`https://flagcdn.com/20x15/${LANGUAGE_TO_FLAG[form.learningLanguage]}.png`}
                        alt="flag"
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-auto"
                      />
                    )}
                    <select
                      name="learningLanguage"
                      value={form.learningLanguage}
                      onChange={handleChange}
                      className={`select select-bordered w-full ${form.learningLanguage ? "pl-10" : ""}`}
                    >
                      <option value="">Select language you're learning</option>
                      {LANGUAGES.map((lang) => (
                        <option key={`learning-${lang}`} value={lang.toLowerCase()}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Nhóm 3: Cài đặt Dịch thuật (Nằm cuối cùng) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2 text-primary">
                <Globe className="size-5" /> Translation Settings
              </h3>

              <div className="bg-base-200/50 rounded-lg p-4 space-y-4 border border-base-200">
                {/* 1. Toggle Bật/Tắt */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-between">
                    <div>
                      <span className="label-text font-medium text-base">Enable Message Translation</span>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        Show a translate button on incoming messages.
                      </p>
                    </div>
                    <input 
                      type="checkbox" 
                      name="enableTranslation"
                      className="toggle toggle-primary" 
                      checked={form.enableTranslation}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                {/* 2. Target Language Dropdown (Chỉ hiện khi Toggle = ON) */}
                {form.enableTranslation && (
                  <div className="form-control animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="label pt-0">
                      <span className="label-text">Translate messages to:</span>
                      <span className="text-xs opacity-70">
                        Defaults to {form.nativeLanguage ? capitialize(form.nativeLanguage) : "English"} if not set
                      </span>
                    </label>
                    <div className="relative">
                      {form.targetLanguage && LANGUAGE_TO_FLAG[form.targetLanguage] && (
                        <img
                          src={`https://flagcdn.com/20x15/${LANGUAGE_TO_FLAG[form.targetLanguage]}.png`}
                          alt="flag"
                          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-auto"
                        />
                      )}
                      <select
                        name="targetLanguage"
                        value={form.targetLanguage}
                        onChange={handleChange}
                        className={`select select-bordered w-full border-primary/40 focus:border-primary ${form.targetLanguage ? "pl-10" : ""}`}
                      >
                        <option value="">Same as Native Language</option>
                        {LANGUAGES.map((lang) => (
                          <option key={`target-${lang}`} value={lang.toLowerCase()}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nút Save */}
            <div className="flex justify-end pt-2">
              <button 
                className="btn btn-primary min-w-[120px]" 
                type="submit"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;