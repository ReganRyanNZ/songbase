# Tiny key/value store for app-wide settings — the only persistent global-config
# mechanism in the app (no Redis, Rails.cache unconfigured in prod). Used today
# to hold a monotonic +cache_version+ that an admin can bump to force every
# client device to wipe its IndexedDB cache and re-download (see
# SongsController#reset_cache and DatabaseSetupAndSync#checkCacheVersion).
class AppSetting < ApplicationRecord
  validates :key, presence: true, uniqueness: true

  # Monotonic version. Starts at 1; bumping it invalidates every client cache.
  CACHE_VERSION_KEY = "cache_version"
  CACHE_VERSION_DEFAULT = 1

  def self.get(key, default = nil)
    where(key: key).pick(:value) || default
  end

  def self.set(key, value)
    upsert({ key: key, value: value.to_s }, unique_by: :key)
    value
  end

  def self.cache_version
    get(CACHE_VERSION_KEY, CACHE_VERSION_DEFAULT).to_i
  end

  def self.bump_cache_version!
    set(CACHE_VERSION_KEY, cache_version + 1)
    cache_version
  end
end
