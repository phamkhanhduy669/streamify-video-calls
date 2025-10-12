import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "../lib/api";
import PageLoader from "../components/PageLoader";
import { LANGUAGES, LANGUAGE_TO_FLAG } from "../constants";
import { ShuffleIcon, LoaderIcon, MapPinIcon } from "lucide-react";
import { getLanguageFlag } from "../components/FriendCard";
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
    learningLanguage: "",
    location: "",
  });

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.setQueryData(["profile"], res);
      queryClient.invalidateQueries({ queryKey: ["users", "friends"] });
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
      learningLanguage: user.learningLanguage || "",
      location: user.location || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) return <PageLoader />;

  const user = data?.user;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate(form, {
      onSuccess: () => {
        toast.success("Profile updated");
      },
      onError: (err) => {
        const msg = err?.response?.data?.message || "Could not update profile";
        toast.error(msg);
      },
    });
  }

  const handleRandomAvatar = () => {
    const idx = Math.floor(Math.random() * 100) + 1; // 1-100 included
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    setForm((s) => ({ ...s, profilePic: randomAvatar }));
    toast.success("Random profile picture generated");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="card p-4">
            <div className="flex flex-col items-center gap-4">
              <div className="size-32 rounded-full overflow-hidden bg-base-300">
                {form.profilePic ? (
                  <img src={form.profilePic} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg className="w-16 h-16 opacity-40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M3 21a9 9 0 0118 0" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                )}

              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={handleRandomAvatar} className="btn btn-accent">
                  <ShuffleIcon className="size-4 mr-2" />
                  Generate Random Avatar
                </button>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold">{form.fullName || "Unknown"}</h3>
                <p className="text-sm opacity-70">{form.location || "Unknown"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <form onSubmit={handleSubmit} className="card p-4 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} className="input input-bordered w-full" />
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} className="textarea textarea-bordered w-full" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="label">Location</label>
                <div className="relative">
                  <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                  <input name="location" value={form.location} onChange={handleChange} className="input input-bordered w-full pl-10" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <div className="flex items-center justify-between w-full">
                    <span className="label-text">Native Language</span>
                    <span className="flex items-center gap-1 text-sm opacity-70">
                      {getLanguageFlag(form.nativeLanguage)}
                      {form.nativeLanguage ? capitialize(form.nativeLanguage) : "Not selected"}
                    </span>
                  </div>
                </label>
                <div className="relative">
                  {form.nativeLanguage && LANGUAGE_TO_FLAG[form.nativeLanguage] && (
                    <img
                      src={`https://flagcdn.com/20x15/${LANGUAGE_TO_FLAG[form.nativeLanguage]}.png`}
                      alt={`${form.nativeLanguage} flag`}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-auto"
                    />
                  )}
                  <select
                    name="nativeLanguage"
                    value={form.nativeLanguage}
                    onChange={(e) => setForm((s) => ({ ...s, nativeLanguage: e.target.value }))}
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

              <div className="form-control">
                <label className="label">
                  <div className="flex items-center justify-between w-full">
                    <span className="label-text">Learning Language</span>
                    <span className="flex items-center gap-1 text-sm opacity-70">
                      {getLanguageFlag(form.learningLanguage)}
                      {form.learningLanguage ? capitialize(form.learningLanguage) : "Not selected"}
                    </span>
                  </div>
                </label>
                <div className="relative">
                  {form.learningLanguage && LANGUAGE_TO_FLAG[form.learningLanguage] && (
                    <img
                      src={`https://flagcdn.com/20x15/${LANGUAGE_TO_FLAG[form.learningLanguage]}.png`}
                      alt={`${form.learningLanguage} flag`}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-auto"
                    />
                  )}
                  <select
                    name="learningLanguage"
                    value={form.learningLanguage}
                    onChange={(e) => setForm((s) => ({ ...s, learningLanguage: e.target.value }))}
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

            <div className="flex justify-end">
              <button className="btn btn-primary" type="submit">{mutation.isLoading ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
