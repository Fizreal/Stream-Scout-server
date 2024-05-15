export const formatProfileInformation = (profile) => {
  return {
    _id: profile._id,
    username: profile.username,
    userId: profile.user,
    country: profile.country
  }
}
