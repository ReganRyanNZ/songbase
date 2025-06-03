class ApplicationMailer < ActionMailer::Base
  default from: "no-reply@songbase.life"
  layout 'mailer'

  SUPPORT_EMAIL = "songbase.brothers@gmail.com"

end
