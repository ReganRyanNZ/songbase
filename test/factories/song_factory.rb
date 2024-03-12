FactoryBot.define do
  factory :song do
    title { "From the time I spoke Your Name" }
    lyrics { "1\nFrom the [D]time I [G]spoke Your [D]Name,\nLord, my l[G]ife's not been the [D]same\n[]Since I called on the only One Who'd\n[A]Save me[A7].\nWhen fors[D]aken, [G]in desp[D]air—\nWho'd have t[G]hought that You'd be t[D]here?\nNow I've found out, [A]Jesus, You're [D]ali[D7]ve!\n\n  Now my [G]eyes begin to see\n  I'm living [D]as I ought to be,\n  As this [G]turning, burning God\n  Moves in my [A]heart.[A7]\n  I don't [D]care now [G]how I [D]feel;\n  I just [G]know that this is [D]real,\n  And I know, O [A]Jesus, You're a[D]live!\n\n2\nAll my friends may think it’s square,\nSince I’ve touched You I don’t care,\nFor I’ve found You’re the only life worth living.\nThough some mock and criticise,\nLord, they just don’t realise\nThat I’ve found out, Jesus, You’re alive!\n\n3\nIt's no statue that I call,\nNot a picture on the wall,\nBut a Person Who lives His life\nwithin me.\nWish they'd told me long before,\nAll You want's an open door,\nAnd that really, Jesus, You're alive!" }
    lang { "english" }

    trait :accord_to_my_earnest do
      title { "According to my earnest" }
      lyrics { "# Capo 3\n# New Tune:\n[G]According to my [C]earnest\nexpectation and [D]hope\nthat in [G]nothing I will [C]be\nput to [D]shame,\nbut with all [G]boldness, as al[D]ways,\neven [C]now Christ will be\nmagnified in my [D]body,\nwhether through [G]life\nor through [C]death.\nPhilippians [D]1:[G]20" }
    end

    trait :abba_father do
      title { "Abba, Father" }
      lyrics { "# Capo 2\n\n  [D]Abba, [G]Father!\n  [D]How sweet it [A]is to call on Your [D]name!\n  Abba, [G]Father!\n  [D]We [A]love [D]You!\n\n1\n[G]Is it just us or i[D]s it Him?\n[G]The Spirit of the S[D]on You sent us?\n[G]From deep within this m[D]ingled cry,\n[G]“Ab[A]ba, Fa[D]ther!”\n\n2\nHere at the table with the saints\nYour sons enjoy the life You gave us.\nLed by Your firstborn Son we cry,\n“Abba, Father!”\n\n3\nHe leads the many sons to sing\nThe praises of our holy Father.\nIn life we understand this name:\nAbba, Father!\n\n4\nAmidst the church He leads the praise;\nHe’s not ashamed to call us brothers,\nFor just like Him we are of You,\nBorn sons of God!\n\n  Abba, Father!\n  How sweet it is to call on Your name!\n  Abba, Father!\n  We’re Your Sons!\n" }
    end

    trait :portuguese do
      title { "Bendito o homem que confia no Senhor" }
      lyrics { "#Jer 17:7-8\n\n[D]Bendito o h[G]omem que con[D]fia no Sen[A]hor,\nE [D]cuja espe[G]rança é o Sen[A]hor.\n[D]Bendito o h[G]omem que con[D]fia no Sen[A]hor,\nE [D]cuja espe[G]rança é o Sen[A]hor.\n\nPorque ele é [Bm]como árvore[F#m] plantada\nJ[G]unto às ág[D]uas,\nQue [G]estende as ra[D]ízes para o rib[A]eiro\nE não receia quando vem o ca[Bm]lor,\nMas sua folha fica [F#m]verde; e no [G]ano de sequi[D]dão\nNão se pert[A]urba nem deixa de dar o seu fr[Bm]ut[A]o.\n\n[D]Bendito o h[G]omem que con[D]fia [G]no Sen[D]hor\n" }
      lang { "portuguese" }
    end

    # no chords
    trait :now_unto do
      title { "Now unto the King eternal" }
      lyrics { "Now unto the King eternal,\nimmortal, invisible,\nThe only wise God, the only wise God,\nBe honor and glory forever and ever.\nAmen. Amen.\nBe honor and glory forever and ever.\nAmen." }
    end

    trait :hymn_ref_in_comments do
      lyrics { "# Hymns, #123\n\n1\nFrom the [D]time I [G]spoke Your [D]Name,\nLord, my l[G]ife's not been the [D]same\n[]Since I called on the only One Who'd\n[A]Save me[A7].\nWhen fors[D]aken, [G]in desp[D]air—\nWho'd have t[G]hought that You'd be t[D]here?\nNow I've found out, [A]Jesus, You're [D]ali[D7]ve!\n\n  Now my [G]eyes begin to see\n  I'm living [D]as I ought to be,\n  As this [G]turning, burning God\n  Moves in my [A]heart.[A7]\n  I don't [D]care now [G]how I [D]feel;\n  I just [G]know that this is [D]real,\n  And I know, O [A]Jesus, You're a[D]live!\n\n2\nAll my friends may think it’s square,\nSince I’ve touched You I don’t care,\nFor I’ve found You’re the only life worth living.\nThough some mock and criticise,\nLord, they just don’t realise\nThat I’ve found out, Jesus, You’re alive!\n\n3\nIt's no statue that I call,\nNot a picture on the wall,\nBut a Person Who lives His life\nwithin me.\nWish they'd told me long before,\nAll You want's an open door,\nAnd that really, Jesus, You're alive!" }
    end

    # Multiple tunes, with different wording
    trait :be_thou_supreme do
      title { "Be Thou supreme, O Jesus Christ" }
      lyrics { "### Original tune\n\n# Capo 1\n\n1\nBe [G]Thou su[D]preme, O [G]Jesus [C]Christ,\nNor [Am]creed, nor [D]form, nor [G]word,\nNor [D]holy [G]Church, nor [B7]human [Em]love,\nCom[G]pare with [Am]Thee, [D]my [G]Lord!\n\n2\nBe Thou supreme, O Jesus Christ,\nThy love has conquered me;\nBeneath Thy Cross I die to self,\nAnd live alone to Thee.\n\n3\nBe Thou supreme, O Jesus Christ,\nMy inmost being fill;\nSo shall I think as Thou dost think,\nAnd will as Thou dost will.\n\n4\nBe Thou supreme, O Jesus Christ,\nThy life transfigure mine;\nAnd through this veil of mortal flesh,\nLord, let Thy splendor shine.\n\n5\nBe Thou supreme, O Jesus Christ,\nMy soul exults in Thee;\nTo be Thy slave, to do Thy will,\nIs my felicity.\n\n### New tune (with chorus)\n\n1\n[C]Be Thou su[G]preme, O [Am]Jesus Christ,\n[F]Thy love has conquered [G]me;\n[C]Beneath Thy [G]Cross I [Am]die to self,\n[F]And live a[G]lone to [C]Thee.\n\n  Be Thou su[F]prem[G]e, O Jesus [C]Christ,\n  Nor creed, nor [F]for[G]m, nor [C]word,\n  Nor holy [F]Church, [G]nor [Am]human love,\n  [F]Compare with [G]Thee, my [C]Lord!\n\n2\nBe Thou supreme, O Jesus Christ,\nMy inmost being fill;\nSo shall I think as Thou dost think,\nAnd will as Thou dost will.\n\n3\nBe Thou supreme, O Jesus Christ,\nThy life transfigure mine;\nAnd through this veil of mortal flesh,\nLord, let Thy splendor shine.\n\n4\nBe Thou supreme, O Jesus Christ,\nMy soul exults in Thee;\nTo be Thy slave, to do Thy will,\nIs my felicity.\n\n\n# Verse 1 of the original hymn has\n# become the chorus for this tune"}
    end

    # Multiple tunes, with same wording just different chords
    trait :a_little_bird_i_am do
      title { "A little bird I am" }
      lyrics { "### Original tune\n# Capo 3\n\n1\n[G]A little [D7]bird I [G]am,\nShut [C]from the fields of [D]air,[D7]\nAnd [G]in my [D7]cage I [G]sit and sing\nTo [A]Him who [A7]placed me [D]there;\n[D7]Well [G]pleased a prisoner to be,\nBecause, [D]my [G]God[C], it [D]pleas[D7]eth [G]Thee.\n\n2\nNought have I else to do,\nI sing the whole day long;\nAnd He whom most I love to please\nDoth listen to my song;\nHe caught and bound my wandering wing,\nBut still He bends to hear me sing.\n\n3\nThou hast an ear to hear\nA heart to love and bless;\nAnd though my notes were e'er so rude,\nThou wouldst not hear the less;\nBecause Thou knowest as they fall,\nThat love, sweet love, inspires them all.\n\n4\nMy cage confines me round;\nAbroad I cannot fly;\nBut though my wing is closely bound,\nMy heart's at liberty;\nFor prison walls cannot control\nThe flight, the freedom of the soul.\n\n5\nO it is good to soar\nThese bolts and bars above!\nTo Him whose purpose I adore,\nWhose providence I love;\nAnd in Thy mighty will to find\nThe joy, the freedom of the mind.\n\n### Tune 2\n1\n[D]A little [G]bird I am,\nShut [D]from the [Bm]fields of [A]air,\n[D]And in my [G]cage I sit and [D]sing\nTo Him who placed me [A]there;\n[G]Well pleased a [A]prisoner to [F#m  Bm]be,\n[G]Because, my [A]God, it [A7]pleaseth [D]Thee.\n\n2\nNought have I else to do,\nI sing the whole day long;\nAnd He whom most I love to please\nDoth listen to my song;\nHe caught and bound my wandering wing,\nBut still He bends to hear me sing.\n\n3\nThou hast an ear to hear\nA heart to love and bless;\nAnd though my notes were e'er so rude,\nThou wouldst not hear the less;\nBecause Thou knowest as they fall,\nThat love, sweet love, inspires them all.\n\n4\nMy cage confines me round;\nAbroad I cannot fly;\nBut though my wing is closely bound,\nMy heart's at liberty;\nFor prison walls cannot control\nThe flight, the freedom of the soul.\n\n5\nO it is good to soar\nThese bolts and bars above!\nTo Him whose purpose I adore,\nWhose providence I love;\nAnd in Thy mighty will to find\nThe joy, the freedom of the mind.\n\n### Tune 3\n# Capo 4\n\n1\nA [C]little [G]bird I [Am]am,\nShut [F]from the fields of [G]air,\nAnd [C]in my [G]cage I [Am]sit and sing\nTo [F]Him who placed me [G]there;\nWell pleased [C]a [G]priso[Am]ner to be,\nBe[F]cause, my [G]God, it pleaseth [C-F-C]Thee.\n\n2\nNought have I else to do,\nI sing the whole day long;\nAnd He whom most I love to please\nDoth listen to my song;\nHe caught and bound my wandering wing,\nBut still He bends to hear me sing.\n\n3\nThou hast an ear to hear\nA heart to love and bless;\nAnd though my notes were e'er so rude,\nThou wouldst not hear the less;\nBecause Thou knowest as they fall,\nThat love, sweet love, inspires them all.\n\n4\nMy cage confines me round;\nAbroad I cannot fly;\nBut though my wing is closely bound,\nMy heart's at liberty;\nFor prison walls cannot control\nThe flight, the freedom of the soul.\n\n5\nO it is good to soar\nThese bolts and bars above!\nTo Him whose purpose I adore,\nWhose providence I love;\nAnd in Thy mighty will to find\nThe joy, the freedom of the mind." }
    end
  end
end
