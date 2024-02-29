class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  # Handy function to run raw SQL strings from console
  if Rails.env.development?
    def self.sql(str)
      results = ActiveRecord::Base.connection.execute(str)

      if results.present?
        return results.to_a
      else
        return nil
      end
    end
  end
end
