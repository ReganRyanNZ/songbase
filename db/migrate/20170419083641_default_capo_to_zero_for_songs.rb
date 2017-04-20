class DefaultCapoToZeroForSongs < ActiveRecord::Migration[5.0]
  def change
    change_column_null(:songs, :suggested_capo, false, 0) #take away null, make default 0
  end
end
