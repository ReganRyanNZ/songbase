FactoryGirl.define do
  factory :song do
    firstline_title "From the time I spoke Your Name"
    lyrics "\nFrom the ti[D]me I s[G]poke Your Na[D]me,\nLord, my [G]life's not been the [D]same\nSince I called on the only One Who'd\nsav[A]e me.[A7]\nWhen for[D]saken,[G] in de[D]spair --\nWho'd have [G]thought that You'd be t[D]here?\nNow I've found out, J[A]esus, You're a[D]live![D7]\n\n{start_of_chorus}\nNow my[G] eyes begin to see\nI'm living [D]as I ought to be,\nAs this [G]turning, burning God\nmoves in my [A]heart.[A7]\nI don't [D]care now [G]how I fee[D]l;\nI just [G]know that this is [D]real,\nAnd I know, O [A]Jesus, You're a[D]live!\n{end_of_chorus}\n\nAll my friends may think it’s square,\nSince I’ve touched You I don’t care,\nFor I’ve found You’re the only life worth living.\nThough some mock and criticise,\nLord, they just don’t realise\nThat I’ve found out, Jesus, You’re alive!\n\nIt's no statue that I call,\nNot a picture on the wall,\nBut a Person Who lives His life within me.\nWish they'd told me long before,\nAll You want's an open door,\nAnd that really, Jesus, You're alive!"
    lang "en"

    trait :accord_to_my_earnest do
      firstline_title "According to my earnest"
      lyrics "\n[G]According to my [C]earnest\nexpectation and [D]hope\nthat in [G]nothing I will [C]be\nput to [D]shame,\nbut with all [G]boldness, as al[D]ways,\neven [C]now Christ will be\nmagnified in my [D]body,\nwhether through [G]life\nor through [C]death.\nPhilippians [D]1:[G]20"
    end

    trait :abba_father do
      firstline_title "Abba, Father"
      lyrics "\n{start_of_chorus}\nAbb[D]a, Fath[G]er!\nHow[D] sweet it is to[A] call on Your name![D]\nAbba, Fa[G]ther!\n[D]We [A]love[D] You!\n{end_of_chorus}\nIs[G] it just us or i[D]s it Him?\nTh[G]e Spirit of the Son[D] You sent us?\nFr[G]om deep within this mingle[D]d cry,\n[G]“Ab[A]ba, F[D]ather!”\nHere at the table with the saints\nYour sons enjoy the life You gave us.\nLed by Your firstborn Son we cry,\n“Abba, Father!”\nHe leads the many sons to sing\nThe praises of our holy Father.\nIn life we understand this name:\nAbba, Father!\nAmidst the church He leads the praise;\nHe’s not ashamed to call us brothers,\nFor just like Him we are of You,\nBorn sons of God!\n{start_of_chorus}\nAbba, Father!\nHow sweet it is to call on Your name!\nAbba, Father!\nWe’re Your Sons!\n{end_of_chorus}"
    end
  end
end
