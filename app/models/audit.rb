class Audit < ApplicationRecord
  belongs_to :song
  belongs_to :user
  before_save :add_user_to_song

  ACTIONS = %w[create update destroy restore].freeze

  validates :action, inclusion: { in: ACTIONS }, allow_nil: true

  def add_user_to_song
    song.update(last_editor: user.name)
  end

  # Create an audit record with changes tracked
  def self.log(song:, user:, action:, changes: {})
    create(
      song: song,
      user: user,
      action: action,
      changed_fields: changes,
      time: Time.zone.now
    )
  end

  # Helper to format changes for display
  def formatted_changes
    return {} unless changed_fields.present?

    changed_fields.transform_values do |change|
      if change.is_a?(Hash) && change.key?('before') && change.key?('after')
        { from: change['before'], to: change['after'] }
      else
        change
      end
    end
  end

  # Return a human-readable description of the action
  def description
    case action
    when 'create'
      "Created by #{user&.name || 'Unknown'}"
    when 'update'
      "Updated by #{user&.name || 'Unknown'}"
    when 'destroy'
      "Deleted by #{user&.name || 'Unknown'}"
    else
      "Modified by #{user&.name || 'Unknown'}"
    end
  end
end