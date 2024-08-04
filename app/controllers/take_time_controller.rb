class TakeTimeController < ApplicationController

  def take_time
    @cards = card_data
    render :take_time, layout: "robot_visible"
  end

  private

  def card_data
    [
      [
        "Call on the Lord",
        "For the same Lord is Lord of all and rich to all who call upon Him.",
        "Romans 10:12b"
      ],
      [
        "Pray short prayers",
        "O Jehovah, in the morning,<br>You will hear my voice",
        "Psalms 5:3"
      ],
      [
        "Sing",
        "But I will sing of Your strength;<br>And I will joyfully sing of Your <br>lovingkindness in the morning.",
        "Psalms 59:16"
      ],
      [
        "Consecrate",
        "Your people will offer themselves willingly<br>In the day of Your warfare,<br>In the splendor of their consecration.",
        "Psalms 110:3"
      ],
      [
        "Confess",
        "If we confess our sins, He is faithful and righteous to forgive us our sins and cleanse us from all unrighteousness.",
        "1 John 1:9"
      ],
      [
        "Ask",
        "Until now you have asked for nothing in My name; ask and you shall receive, that your joy may be made full.",
        "John 16:24"
      ],
      [
        "Cast",
        "Casting all your anxiety on Him because it matters to Him concerning you.",
        "1 Peter 5:7"
      ],
      [
        "Praise",
        "Through Him then let us offer up a sacrifice of praise continually to God, that is, the fruit of lips confessing His name.",
        "Hebrews 13:15"
      ],
      [
        "Pray read",
        "And receive the helmet of salvation and the sword of the Spirit, which Spirit is the word of God, by means of all prayer and petition.",
        "Ephesians 6:17-18a"
      ],
      [
        "Read",
        "Your words were found and I ate them,<br>And Your word became to me<br>The gladness and joy of my heart.",
        "Jeremiah 15:16a"
      ],
      [
        "Petition",
        "This will turn out to salvation through your petition and the bountiful supply of the Spirit of Jesus Christ.",
        "Philippians 1:19b"
      ]
    ]
  end
end
