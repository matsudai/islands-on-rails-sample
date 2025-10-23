class Vote < ApplicationRecord
  belongs_to :candidate, counter_cache: true

  def self.broadcast_summaries
    candidates = Candidate.order(votes_count: :desc, id: :asc)

    Turbo::StreamsChannel.broadcast_render_to(
      "summaries",
      partial: "summaries/refresh",
      locals: { candidates: }
    )
  end
end
