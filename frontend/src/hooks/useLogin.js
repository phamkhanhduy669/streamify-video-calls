import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../lib/api";

const useLogin = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: () => {
      console.log("Login successful! Invalidating authUser query...");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  return { error, isPending, loginMutation: mutate };
};

export default useLogin;
