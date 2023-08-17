namespace :data_migration do
  desc "From single language into language array for books"
  task books_lang_to_languages: :environment do |args|
    Book.all.each do |book|
      book.update(languages: [book.lang.downcase])
      puts "Updated #{book.name} to have languages: #{book.reload.languages}"
    end
  end

  desc "Shift song_book table into books.songs field"
  task migrate_to_books_songs: :environment do |args|
    Book.all.each do |book|
      songs = {}
      book.song_books.each { |song_book| songs[song_book.song_id] = song_book.index }
      book.update(songs: songs)
      puts "Updated #{book.name} with #{songs.count} songs: \n\n\n\n#{book.reload.songs}\n\n\n\n"
    end
  end
end
