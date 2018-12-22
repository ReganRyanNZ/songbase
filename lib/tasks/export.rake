namespace :export do
  desc "Export .song files for all db songs"
  task songs: :environment do |args|
    Song.all.each do |song|
      title = [song.custom_title, song.firstline_title, song.chorus_title, "unknown_#{song.id}"].reject(&:blank?).first
      File.open("export/#{title}.song", "w") do |f|
        lyrics = song.lyrics.gsub(/^\#\s?([^\n\r]*)/, '{comments: \1}')
        f.write(lyrics)
      end
    end
  end

  desc "Export song files listed"
  task song_files: :environment do |args|
    songs = []
    File.read("tmp/song_list").each_line do |song|
      song.strip!
      if song.match? /\A\d+\z/
        songs << Song.find(song)
        next
      end
      count = Song.where("firstline_title LIKE ?", "%#{song.strip}%").count
      if count != 1
        binding.pry
        puts "Error finding: '#{song.strip}' (#{count})"
      else
        songs << Song.where("firstline_title LIKE ?", "%#{song.strip}%").first
      end
    end
    puts "-- Found #{songs.count} songs, exporting to tmp/songs..."
    Dir.mkdir("tmp/songs") unless Dir.exists?("tmp/songs")

    songs.each do |song|
      File.open("tmp/songs/#{song.firstline_title}.song", "w") do |file|
        file << song.lyrics
      end
    end
    puts "Done."
  end

  desc "Export book as pdf"
  task :book_pdf, [:book_id] => :environment do |_, args|
    book = Book.find(args[:book_id])

    CreateBookPDF.call(book)
  end
end
