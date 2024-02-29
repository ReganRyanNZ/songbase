class FancyIndexForSongTitles < ActiveRecord::Migration[7.1]
  def up
    enable_extension("pg_trgm");
    add_index(:songs, :title, using: 'gin', opclass: :gin_trgm_ops)
  end

  def down
    remove_index(:songs, :title)
  end
end
