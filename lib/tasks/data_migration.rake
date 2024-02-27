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

  desc "Add language links to songs"
  task build_language_links: :environment do |args|
    # FR french is good
    # S spanish is good
    # E English is good
    # Portuguese is just 1-1 match (hymnal at least)
    # Missing:
      # German - The numbering system I have is different from all the hymnal sites I've found, they mirror the english numbers. Dutch is currently making progress to do the same, so maybe that's the way of the future?
      # Dutch (but they are updating? So we'll leave it for now)

    english_hymnal = Book.find_by(slug: "english_hymnal")
    spanish_hymnal = Book.find_by(slug: "spanish_hymnal")
    french_hymnal = Book.find_by(slug: "french_hymnal")
    portuguese_hymnal = Book.find_by(slug: "hinos")

    filename = Rails.root.join('db', 'links.txt')
    File.foreach(filename) do |line|
      eng = line[/(?<=E)\d+/]
      next unless eng.present?

      ids = [english_hymnal.song_id_from_index(eng)]

      portuguese = eng
      port_song_id = portuguese_hymnal.song_id_from_index(portuguese) if portuguese.present?
      ids << port_song_id if port_song_id.present?

      french = line[/(?<= FR)\d+/]
      fr_song_id = french_hymnal.song_id_from_index(french) if french.present?
      ids << fr_song_id if fr_song_id.present?

      spanish = line[/(?<= S)\d+/]
      spa_song_id = spanish_hymnal.song_id_from_index(spanish) if spanish.present?
      ids << spa_song_id if spa_song_id.present?

      ids.each_with_index do |id, i|
        (ids[i+1..] || []).each do |other_id|
          Song.find(id).add_language_link(other_id)
        end
      end
    end
  end
end
