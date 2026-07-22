# Edit history for books — mirrors the song Audit model (app/models/audit.rb).
# Captures who changed a Book and what changed, so admins can audit edits to
# custom/shared books (create/update/destroy/restore). Written from
# BooksController via BookAudit.log, using the same {before, after} change
# format as song audits (ApplicationController#format_changes_for_audit).
class BookAudit < ApplicationRecord
  belongs_to :book
  belongs_to :user

  ACTIONS = %w[create update destroy restore].freeze
  validates :action, inclusion: { in: ACTIONS }, allow_nil: true

  # Create an audit record with changes tracked. Mirrors Audit.log.
  def self.log(book:, user:, action:, changes: {})
    create(
      book: book,
      user: user,
      action: action,
      changed_fields: changes,
      time: Time.zone.now
    )
  end

  # Helper to format changes for display — mirrors Audit#formatted_changes.
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

  # Human-readable description of the action.
  def description
    case action
    when 'create'
      "Created by #{user&.name || 'Unknown'}"
    when 'update'
      "Updated by #{user&.name || 'Unknown'}"
    when 'destroy'
      "Deleted by #{user&.name || 'Unknown'}"
    when 'restore'
      "Restored by #{user&.name || 'Unknown'}"
    else
      "Modified by #{user&.name || 'Unknown'}"
    end
  end
end
