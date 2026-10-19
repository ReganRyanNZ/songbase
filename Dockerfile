# Songbase DEV container.
#
# This image only provides the runtime (Ruby + native-build deps). The app
# source is bind-mounted into /app (see docker-compose.yml), and gems are
# installed at startup into /app/vendor/bundle — so:
#   * editing app code  -> Rails' dev reloader picks it up per request
#   * editing the Gemfile -> `bundle install` runs on next container start
# with no image rebuild needed in either case.
FROM ruby:4.0.1

# build-essential: native exts (pg, sassc, ...). libpq-dev: pg gem.
# nodejs: ExecJS runtime for react-rails / sassc / terser. tzdata: timezones.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      nodejs \
      tzdata \
      git \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
