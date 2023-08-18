FactoryBot.define do
  factory :song do
    title { "From the time I spoke Your Name" }
    lyrics { "1\nFrom the [D]time I [G]spoke Your [D]Name,\nLord, my l[G]ife's not been the [D]same\n[]Since I called on the only One Who'd\n[A]Save me[A7].\nWhen fors[D]aken, [G]in desp[D]air—\nWho'd have t[G]hought that You'd be t[D]here?\nNow I've found out, [A]Jesus, You're [D]ali[D7]ve!\n\n  Now my [G]eyes begin to see\n  I'm living [D]as I ought to be,\n  As this [G]turning, burning God\n  Moves in my [A]heart.[A7]\n  I don't [D]care now [G]how I [D]feel;\n  I just [G]know that this is [D]real,\n  And I know, O [A]Jesus, You're a[D]live!\n\n2\nAll my friends may think it’s square,\nSince I’ve touched You I don’t care,\nFor I’ve found You’re the only life worth living.\nThough some mock and criticise,\nLord, they just don’t realise\nThat I’ve found out, Jesus, You’re alive!\n\n3\nIt's no statue that I call,\nNot a picture on the wall,\nBut a Person Who lives His life\nwithin me.\nWish they'd told me long before,\nAll You want's an open door,\nAnd that really, Jesus, You're alive!" }
    lang { "english" }

    trait :accord_to_my_earnest do
      title { "According to my earnest" }
      lyrics { "\n[G]According to my [C]earnest\nexpectation and [D]hope\nthat in [G]nothing I will [C]be\nput to [D]shame,\nbut with all [G]boldness, as al[D]ways,\neven [C]now Christ will be\nmagnified in my [D]body,\nwhether through [G]life\nor through [C]death.\nPhilippians [D]1:[G]20" }
    end

    trait :abba_father do
      title { "Abba, Father" }
      lyrics { "\n  Abba, Father!\nHow sweet it is to call on Your name!\n  Abba, Father!\n  We love You!\n\nIs it just us or is it Him?\nThe Spirit of the Son You sent us?\nFrom deep within this mingled cry,\n“Abba, Father!”\nHere at the table with the saints\nYour sons enjoy the life You gave us.\nLed by Your firstborn Son we cry,\n“Abba, Father!”\nHe leads the many sons to sing\nThe praises of our holy Father.\nIn life we understand this name:\nAbba, Father!\nAmidst the church He leads the praise;\nHe’s not ashamed to call us brothers,\nFor just like Him we are of You,\nBorn sons of God!\n\nAbba, Father!\nHow sweet it is to call on Your name!\nAbba, Father!\nWe’re Your Sons!\n" }
    end

    trait :portuguese do
      title { "Bendito o homem que confia no Senhor" }
      lyrics { "#Jer 17:7-8\n\n[D]Bendito o h[G]omem que con[D]fia no Sen[A]hor,\nE [D]cuja espe[G]rança é o Sen[A]hor.\n[D]Bendito o h[G]omem que con[D]fia no Sen[A]hor,\nE [D]cuja espe[G]rança é o Sen[A]hor.\n\nPorque ele é [Bm]como árvore[F#m] plantada\nJ[G]unto às ág[D]uas,\nQue [G]estende as ra[D]ízes para o rib[A]eiro\nE não receia quando vem o ca[Bm]lor,\nMas sua folha fica [F#m]verde; e no [G]ano de sequi[D]dão\nNão se pert[A]urba nem deixa de dar o seu fr[Bm]ut[A]o.\n\n[D]Bendito o h[G]omem que con[D]fia [G]no Sen[D]hor\n" }
      lang { "portuguese" }
    end

    trait :no_chords do
      lyrics { "1\nFrom the time I spoke Your Name,\nLord, my life's not been the same\nSince I called on the only One Who'd\nSave me.\nWhen forsaken, in despair—\nWho'd have thought that You'd be there?\nNow I've found out, Jesus, You're alive!\n\n  Now my eyes begin to see\n  I'm living as I ought to be,\n  As this turning, burning God\n  Moves in my heart.\n  I don't care now how I feel;\n  I just know that this is real,\n  And I know, O Jesus, You're alive!\n\n2\nAll my friends may think it’s square,\nSince I’ve touched You I don’t care,\nFor I’ve found You’re the only life worth living.\nThough some mock and criticise,\nLord, they just don’t realise\nThat I’ve found out, Jesus, You’re alive!\n\n3\nIt's no statue that I call,\nNot a picture on the wall,\nBut a Person Who lives His life\nwithin me.\nWish they'd told me long before,\nAll You want's an open door,\nAnd that really, Jesus, You're alive!" }
    end

    trait :hymn_ref_in_comments do
      lyrics { "# Hymns, #123\n\n1\nFrom the [D]time I [G]spoke Your [D]Name,\nLord, my l[G]ife's not been the [D]same\n[]Since I called on the only One Who'd\n[A]Save me[A7].\nWhen fors[D]aken, [G]in desp[D]air—\nWho'd have t[G]hought that You'd be t[D]here?\nNow I've found out, [A]Jesus, You're [D]ali[D7]ve!\n\n  Now my [G]eyes begin to see\n  I'm living [D]as I ought to be,\n  As this [G]turning, burning God\n  Moves in my [A]heart.[A7]\n  I don't [D]care now [G]how I [D]feel;\n  I just [G]know that this is [D]real,\n  And I know, O [A]Jesus, You're a[D]live!\n\n2\nAll my friends may think it’s square,\nSince I’ve touched You I don’t care,\nFor I’ve found You’re the only life worth living.\nThough some mock and criticise,\nLord, they just don’t realise\nThat I’ve found out, Jesus, You’re alive!\n\n3\nIt's no statue that I call,\nNot a picture on the wall,\nBut a Person Who lives His life\nwithin me.\nWish they'd told me long before,\nAll You want's an open door,\nAnd that really, Jesus, You're alive!" }
    end
  end
end
