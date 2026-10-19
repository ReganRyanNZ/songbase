class AddShareCodeToBooks < ActiveRecord::Migration[7.1]
  # Share links carry a non-sequential code (name prefix + 5 digits, e.g.
  # camp-w-48392) instead of the numeric id so book ids can't be guessed.
  # Legacy numeric links keep working — SongsController resolves both.
  def up
    add_column :books, :share_code, :string
    add_index :books, :share_code, unique: true

    Book.unscoped.find_each do |book|
      prefix = book.name.to_s.downcase[0, 6].strip.gsub(/\s+/, "-").gsub(/[^a-z0-9-]/, "")
      prefix = "book" if prefix.empty?

      loop do
        candidate = "#{prefix}-#{format('%05d', rand(100_000))}"
        next if Book.unscoped.exists?(share_code: candidate)

        book.update_columns(share_code: candidate)
        break
      end
    end
  end

  def down
    remove_index :books, :share_code
    remove_column :books, :share_code
  end
end
